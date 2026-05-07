import { CONFIG } from './config.js';
import { auth } from './auth.js';

class SheetsAPI {
  constructor() {
    this.baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}`;
  }

  async _request(url, options = {}) {
    if (!auth.isAuthenticated()) throw new Error('No autenticado');
    const token = auth.getAccessToken();
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers 
    };

    const res = await window.fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json();
      console.error('API Error Details:', err);
      throw new Error(err.error?.message || 'Error en la petición');
    }
    return res.json();
  }

  async fetch(action) {
    if (action === 'getall') {
      try {
        const metaData = await this._request(`${this.baseUrl}?fields=sheets.properties.title`);
        const existingSheets = metaData.sheets.map(s => s.properties.title);

        const requiredSheets = ['Cuentas', 'Gastos', 'Ingresos', 'Transferencias', 'Periodos', 'TiposIngreso', 'Categorias', 'FormasPago', 'Servicios'];
        const sheetsToFetch = requiredSheets.filter(s => existingSheets.includes(s));
        
        const query = sheetsToFetch.map(r => `ranges=${encodeURIComponent(r)}!A:Z`).join('&');
        const data = await this._request(`${this.baseUrl}/values:batchGet?${query}`);
        
        const result = {};
        requiredSheets.forEach(s => result[this._getStateKey(s)] = []);

        if (data.valueRanges) {
          data.valueRanges.forEach((range, i) => {
            const sheetName = sheetsToFetch[i];
            result[this._getStateKey(sheetName)] = this._mapValuesToObjects(range.values);
          });
        }
        return { status: 'success', data: result };
      } catch (e) {
        return { status: 'error', message: e.message };
      }
    }
  }

  async post(action, body) {
    const actionToSheet = {
      'addGasto': 'Gastos', 'addIngreso': 'Ingresos', 'addTransferencia': 'Transferencias',
      'addCuenta': 'Cuentas', 'addTipoIngreso': 'TiposIngreso', 'addCategoria': 'Categorias', 
      'addFormaPago': 'FormasPago', 'addServicio': 'Servicios', 'addPeriodo': 'Periodos'
    };

    if (action.startsWith('add')) {
      return this._appendRow(actionToSheet[action], body);
    }
    
    if (action.startsWith('delete')) {
      const entity = action.replace('delete', '');
      const sheetMap = { 'TipoIngreso': 'TiposIngreso', 'Categoria': 'Categorias', 'FormaPago': 'FormasPago', 'Servicio': 'Servicios' };
      const sheetName = sheetMap[entity] || (entity.charAt(0).toUpperCase() + entity.slice(1) + (entity.endsWith('s') ? '' : 's'));
      return this._deleteRowById(sheetName, body.id);
    }
    
    return { status: 'error', message: 'Acción no soportada' };
  }

  _getStateKey(sheetName) {
    const map = {
      'Cuentas': 'cuentas', 'Gastos': 'gastos', 'Ingresos': 'ingresos', 'Transferencias': 'transferencias',
      'Periodos': 'periodos', 'TiposIngreso': 'tiposIngreso', 'Categorias': 'categorias', 'FormasPago': 'formasPago',
      'Servicios': 'servicios'
    };
    return map[sheetName] || sheetName.toLowerCase();
  }

  _mapValuesToObjects(values) {
    if (!values || values.length < 1) return [];
    const rawHeaders = values[0];
    const headers = rawHeaders.map(h => {
      if (!h) return '';
      let normalized = h.toString().trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');
      const specialMap = { 'año': 'año', 'anio': 'anio', 'saldoinicial': 'saldoInicial', 'cuentaorigen': 'cuentaOrigen', 'cuentadestino': 'cuentaDestino', 'tipoingreso': 'tipoIngreso', 'formapago': 'formaPago', 'esservicio': 'esServicio' };
      return specialMap[normalized.toLowerCase()] || normalized;
    });
    return values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    });
  }

  async _appendRow(sheetName, data) {
    // 1. Obtener cabeceras reales
    const encodedSheet = encodeURIComponent(`'${sheetName}'`);
    const headersData = await this._request(`${this.baseUrl}/values/${encodedSheet}!1:1`);
    if (!headersData.values || !headersData.values[0]) throw new Error(`Hoja ${sheetName} no tiene encabezados`);
    
    const headers = headersData.values[0];
    const row = headers.map(h => {
      const normH = h.toString().toLowerCase().replace(/\s+/g, '');
      const key = Object.keys(data).find(k => k.toLowerCase().replace(/\s+/g, '') === normH);
      return key ? data[key] : '';
    });

    // 2. Append
    await this._request(`${this.baseUrl}/values/${encodedSheet}!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({ values: [row] })
    });
    return { status: 'success' };
  }

  async _deleteRowById(sheetName, id) {
    const encodedSheet = encodeURIComponent(`'${sheetName}'`);
    const data = await this._request(`${this.baseUrl}/values/${encodedSheet}!A:A`);
    if (!data.values) return { status: 'error' };
    
    const rowIndex = data.values.findIndex(row => row[0].toString() === id.toString());
    if (rowIndex === -1) return { status: 'error' };

    const meta = await this._request(`${this.baseUrl}?fields=sheets.properties`);
    const sheetId = meta.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

    await this._request(`${this.baseUrl}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      })
    });
    return { status: 'success' };
  }
}

export const api = new SheetsAPI();

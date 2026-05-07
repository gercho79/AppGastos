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
      throw new Error(err.error?.message || 'Error en Google Sheets');
    }
    return res.json();
  }

  // ────── LECTURA ──────

  async fetch(action) {
    if (action === 'getall') {
      try {
        const meta = await this._request(`${this.baseUrl}?fields=sheets.properties.title`);
        const existing = meta.sheets.map(s => s.properties.title);
        const required = ['Cuentas', 'Gastos', 'Ingresos', 'Transferencias', 'Periodos', 'TiposIngreso', 'Categorias', 'FormasPago', 'Servicios'];
        const active = required.filter(s => existing.includes(s));
        
        const query = active.map(r => `ranges=${encodeURIComponent(r)}!A:Z`).join('&');
        const data = await this._request(`${this.baseUrl}/values:batchGet?${query}`);
        
        const result = {};
        required.forEach(s => result[this._stateKey(s)] = []);
        if (data.valueRanges) {
          data.valueRanges.forEach((range, i) => {
            result[this._stateKey(active[i])] = this._parseRows(range.values);
          });
        }
        return { status: 'success', data: result };
      } catch (e) {
        console.error('Error cargando datos:', e);
        return { status: 'error', message: e.message };
      }
    }
  }

  // ────── ESCRITURA ──────

  async post(action, body) {
    const sheetMap = {
      'addGasto': 'Gastos', 'addIngreso': 'Ingresos', 'addTransferencia': 'Transferencias',
      'addCuenta': 'Cuentas', 'addTipoIngreso': 'TiposIngreso', 'addCategoria': 'Categorias', 
      'addFormaPago': 'FormasPago', 'addServicio': 'Servicios', 'addPeriodo': 'Periodos'
    };

    if (action.startsWith('add')) {
      return this._appendRow(sheetMap[action], body);
    }
    
    if (action.startsWith('delete')) {
      const entity = action.replace('delete', '');
      const delMap = { 'TipoIngreso': 'TiposIngreso', 'Categoria': 'Categorias', 'FormaPago': 'FormasPago', 'Servicio': 'Servicios' };
      return this._deleteRow(delMap[entity] || entity, body.id);
    }
  }

  // ────── HELPERS INTERNOS ──────

  _stateKey(sheetName) {
    const map = { 'TiposIngreso': 'tiposIngreso', 'FormasPago': 'formasPago', 'Transferencias': 'transferencias' };
    return map[sheetName] || sheetName.toLowerCase();
  }

  _parseRows(values) {
    if (!values || values.length < 1) return [];
    const rawHeaders = values[0];
    const headers = rawHeaders.map(h => (h || '').toString().trim().toLowerCase().replace(/\s+/g, ''));
    return values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = (row && row[i] !== undefined) ? row[i] : '';
      });
      return obj;
    });
  }

  async _appendRow(sheetName, data) {
    const enc = encodeURIComponent(`'${sheetName}'`);
    
    // PASO 1: Contar filas existentes leyendo SOLO la columna A
    const colA = await this._request(`${this.baseUrl}/values/${enc}!A:A`);
    const rowCount = (colA.values || []).length;
    const nextRow = rowCount + 1;
    
    // PASO 2: Leer la fila 1 COMPLETA para obtener todos los encabezados
    const headerRes = await this._request(`${this.baseUrl}/values/${enc}!1:1`);
    const headers = headerRes.values?.[0];
    if (!headers || headers.length === 0) {
      throw new Error(`La hoja "${sheetName}" no tiene encabezados en la fila 1`);
    }

    // PASO 3: Armar la fila de datos alineada con los encabezados
    const row = headers.map(h => {
      const normalizedHeader = h.toString().trim().toLowerCase().replace(/\s+/g, '');
      const matchingKey = Object.keys(data).find(k => 
        k.toLowerCase().replace(/\s+/g, '') === normalizedHeader
      );
      return matchingKey !== undefined ? data[matchingKey] : '';
    });

    // PASO 4: Escribir en la fila exacta (rango explícito A{n}:Z{n})
    const lastCol = String.fromCharCode(64 + headers.length); // A=65, B=66...
    const range = `${enc}!A${nextRow}:${lastCol}${nextRow}`;
    
    await this._request(`${this.baseUrl}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [row] })
    });
    
    return { status: 'success' };
  }

  async _deleteRow(sheetName, id) {
    const enc = encodeURIComponent(`'${sheetName}'`);
    const colA = await this._request(`${this.baseUrl}/values/${enc}!A:A`);
    if (!colA.values) return { status: 'error', message: 'Hoja vacía' };
    
    const rowIndex = colA.values.findIndex(r => r[0]?.toString() === id.toString());
    if (rowIndex === -1) throw new Error('Registro no encontrado');

    const meta = await this._request(`${this.baseUrl}?fields=sheets.properties`);
    const sheet = meta.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Hoja "${sheetName}" no existe`);

    await this._request(`${this.baseUrl}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ 
          deleteDimension: { 
            range: { sheetId: sheet.properties.sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 } 
          } 
        }]
      })
    });
    return { status: 'success' };
  }
}

export const api = new SheetsAPI();

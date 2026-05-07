import { CONFIG } from './config.js';
import { auth } from './auth.js';

class SheetsAPI {
  constructor() {
    this.baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}`;
  }

  async fetch(action) {
    if (!auth.isAuthenticated()) return { status: 'error', message: 'No autenticado' };
    const token = auth.getAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    if (action === 'getall') {
      try {
        const metaRes = await window.fetch(`${this.baseUrl}?fields=sheets.properties.title`, { headers });
        const metaData = await metaRes.json();
        const existingSheets = metaData.sheets.map(s => s.properties.title);

        const requiredSheets = ['Cuentas', 'Gastos', 'Ingresos', 'Transferencias', 'Periodos', 'TiposIngreso', 'Categorias', 'FormasPago'];
        const sheetsToFetch = requiredSheets.filter(s => existingSheets.includes(s));
        
        const query = sheetsToFetch.map(r => `ranges=${r}!A:Z`).join('&');
        const res = await window.fetch(`${this.baseUrl}/values:batchGet?${query}`, { headers });
        const data = await res.json();
        
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
        console.error('API Fetch Error:', e);
        return { status: 'error', message: e.message };
      }
    }
  }

  async post(action, body) {
    if (!auth.isAuthenticated()) throw new Error('No autenticado');
    const token = auth.getAccessToken();
    const actionToSheet = {
      'addGasto': 'Gastos', 'addIngreso': 'Ingresos', 'addTransferencia': 'Transferencias',
      'addCuenta': 'Cuentas', 'addTipoIngreso': 'TiposIngreso', 'addCategoria': 'Categorias', 'addFormaPago': 'FormasPago'
    };

    if (action.startsWith('add')) {
      return this._appendRow(actionToSheet[action], body, token);
    }
    // ... delete logic remains the same
  }

  _getStateKey(sheetName) {
    const map = {
      'Cuentas': 'cuentas', 'Gastos': 'gastos', 'Ingresos': 'ingresos', 'Transferencias': 'transferencias',
      'Periodos': 'periodos', 'TiposIngreso': 'tiposIngreso', 'Categorias': 'categorias', 'FormasPago': 'formasPago'
    };
    return map[sheetName] || sheetName.toLowerCase();
  }

  _mapValuesToObjects(values) {
    if (!values || values.length < 1) return [];
    const rawHeaders = values[0];
    
    // Normalizar encabezados: "Cuenta Origen" -> "cuentaOrigen"
    const headers = rawHeaders.map(h => {
      if (!h) return '';
      let normalized = h.toString().toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .trim()
        .split(/\s+/)
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      // Mapeos especiales por si acaso
      const specialMap = {
        'saldoinicial': 'saldoInicial',
        'cuentaorigen': 'cuentaOrigen',
        'cuentadestino': 'cuentaDestino',
        'tipoingreso': 'tipoIngreso',
        'formapago': 'formaPago',
        'esservicio': 'esServicio'
      };
      return specialMap[normalized.toLowerCase()] || normalized;
    });

    return values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }

  async _appendRow(sheetName, data, token) {
    const headersRes = await window.fetch(`${this.baseUrl}/values/${sheetName}!1:1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const headersData = await headersRes.json();
    const headers = headersData.values[0];

    // Mapear data al orden del Excel usando normalización
    const row = headers.map(h => {
      const normH = h.toString().toLowerCase().replace(/\s+/g, '');
      // Buscar en data una clave que normalizada coincida con normH
      const key = Object.keys(data).find(k => k.toLowerCase().replace(/\s+/g, '') === normH);
      return key ? data[key] : '';
    });

    await window.fetch(`${this.baseUrl}/values/${sheetName}!A:A:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
    return { status: 'success' };
  }
}

export const api = new SheetsAPI();

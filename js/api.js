import { showToast } from './utils.js';

class AppAPI {
  constructor() {
    this.apiUrl = localStorage.getItem('appgastos_api_url') || '';
    this.isDemo = !this.apiUrl;
    this.checkManifest();
  }

  async checkManifest() {
    if (this.apiUrl) return;
    try {
      const response = await fetch('manifest.json');
      const manifest = await response.json();
      if (manifest.api_url && !manifest.api_url.includes('PEGAR_AQUI')) {
        this.setApiUrl(manifest.api_url);
        console.log('API URL cargada desde manifest');
      }
    } catch (e) {
      console.warn('No se pudo leer el manifest para la URL');
    }
  }

  setApiUrl(url) {
    this.apiUrl = url;
    this.isDemo = !url;
    localStorage.setItem('appgastos_api_url', url);
  }

  async fetch(action, params = {}) {
    if (this.isDemo) return this.mockFetch(action, params);

    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append('action', action);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }

      const response = await fetch(url.toString(), { redirect: 'follow' });
      return await response.json();
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      throw error;
    }
  }

  async post(action, body = {}) {
    if (this.isDemo) return this.mockPost(action, body);

    try {
      // Usamos text/plain para evitar problemas de CORS preflight con GAS
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify({ action, ...body })
      });
      
      // Con no-cors no podemos leer la respuesta, pero GAS procesa el POST
      return { status: 'success' };
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      throw error;
    }
  }

  // --- Modo Demo ---
  mockFetch(action, params) {
    const db = JSON.parse(localStorage.getItem('appgastos_demo_db')) || this.getInitialDemoDB();
    if (action === 'getall') return { status: 'success', data: db };
    return { status: 'success', data: db[action] || [] };
  }

  mockPost(action, body) {
    const db = JSON.parse(localStorage.getItem('appgastos_demo_db')) || this.getInitialDemoDB();
    
    // Mapping add actions
    const addMap = {
      'addGasto': 'gastos',
      'addIngreso': 'ingresos',
      'addTransferencia': 'transferencias',
      'addCuenta': 'cuentas',
      'addPeriodo': 'periodos',
      'addTipoIngreso': 'tiposIngreso',
      'addCategoria': 'categorias',
      'addFormaPago': 'formasPago'
    };

    if (addMap[action]) {
      const key = addMap[action];
      db[key].unshift({ id: body.id || Date.now(), ...body });
      localStorage.setItem('appgastos_demo_db', JSON.stringify(db));
      return { status: 'success' };
    }

    // Handle updates
    if (action.startsWith('update')) {
      const entity = action.replace('update', '');
      const key = entity.charAt(0).toLowerCase() + entity.slice(1) + (entity.endsWith('s') ? '' : 's');
      // Fix specific pluralization if needed
      const entityMap = { 
        'tipoIngreso': 'tiposIngreso', 
        'categoria': 'categorias',
        'formaPago': 'formasPago'
      };
      const dbKey = entityMap[entity.charAt(0).toLowerCase() + entity.slice(1)] || key;
      
      const index = db[dbKey].findIndex(item => item.id.toString() === body.id.toString());
      if (index !== -1) {
        db[dbKey][index] = { ...db[dbKey][index], ...body };
        localStorage.setItem('appgastos_demo_db', JSON.stringify(db));
        return { status: 'success' };
      }
    }

    // Handle deletes
    if (action.startsWith('delete')) {
      const entity = action.replace('delete', '');
      const entityMap = { 
        'tipoIngreso': 'tiposIngreso', 
        'categoria': 'categorias',
        'formaPago': 'formasPago'
      };
      const dbKey = entityMap[entity.charAt(0).toLowerCase() + entity.slice(1)] || (entity.charAt(0).toLowerCase() + entity.slice(1) + 's');
      
      db[dbKey] = db[dbKey].filter(item => item.id.toString() !== body.id.toString());
      localStorage.setItem('appgastos_demo_db', JSON.stringify(db));
      return { status: 'success' };
    }

    return { status: 'success' };
  }

  getInitialDemoDB() {
    return {
      periodos: [{ id: 1, año: 2024, estado: 'Abierto' }, { id: 2, año: 2025, estado: 'Abierto' }],
      cuentas: [
        { id: 1, nombre: 'Efectivo', moneda: 'ARS', saldoInicial: 5000, activa: true },
        { id: 2, nombre: 'Banco Galicia', moneda: 'ARS', saldoInicial: 150000, activa: true }
      ],
      tiposIngreso: [{ id: 1, nombre: 'Sueldo' }, { id: 2, nombre: 'Venta' }],
      formasPago: [{ id: 1, nombre: 'Efectivo' }, { id: 2, nombre: 'Débito' }, { id: 3, nombre: 'Transferencia' }],
      categorias: [
        { id: 1, nombre: 'Comida', icono: '🍔' },
        { id: 2, nombre: 'Transporte', icono: '🚗' },
        { id: 3, nombre: 'Servicios', icono: '💡' }
      ],
      gastos: [], ingresos: [], transferencias: []
    };
  }
}

export const api = new AppAPI();

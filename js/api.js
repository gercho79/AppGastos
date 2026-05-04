import { showToast } from './utils.js';

class AppAPI {
  constructor() {
    this.apiUrl = localStorage.getItem('appgastos_api_url') || '';
    this.isDemo = !this.apiUrl;
  }

  setApiUrl(url) {
    this.apiUrl = url;
    this.isDemo = !url;
    localStorage.setItem('appgastos_api_url', url);
  }

  async fetch(action, params = {}) {
    if (this.isDemo) {
      return this.mockFetch(action, params);
    }

    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append('action', action);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }

      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      showToast(`Error de conexión: ${error.message}`, 'error');
      throw error;
    }
  }

  async post(action, body = {}) {
    if (this.isDemo) {
      return this.mockPost(action, body);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: JSON.stringify({ action, ...body })
      });
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      showToast(`Error al guardar: ${error.message}`, 'error');
      throw error;
    }
  }

  // --- Demo Mode (LocalStorage) ---
  
  mockFetch(action, params) {
    console.log(`[DEMO] Fetching: ${action}`, params);
    const db = JSON.parse(localStorage.getItem('appgastos_demo_db')) || this.getInitialDemoDB();
    
    switch(action) {
      case 'getAll':
        return { status: 'success', data: db };
      case 'getPeriodos':
        return { status: 'success', data: db.periodos };
      case 'getCuentas':
        return { status: 'success', data: db.cuentas };
      // Add more as needed
      default:
        return { status: 'success', data: db[action] || [] };
    }
  }

  mockPost(action, body) {
    console.log(`[DEMO] Posting: ${action}`, body);
    const db = JSON.parse(localStorage.getItem('appgastos_demo_db')) || this.getInitialDemoDB();
    
    if (action === 'addGasto') {
      db.gastos.unshift({ id: Date.now(), ...body });
    } else if (action === 'addIngreso') {
      db.ingresos.unshift({ id: Date.now(), ...body });
    } else if (action === 'addTransferencia') {
      db.transferencias.unshift({ id: Date.now(), ...body });
    } else if (action === 'addCuenta') {
      db.cuentas.push({ id: Date.now(), ...body });
    } else if (action === 'addPeriodo') {
      db.periodos.push({ id: Date.now(), ...body });
    }
    
    localStorage.setItem('appgastos_demo_db', JSON.stringify(db));
    return { status: 'success', message: 'Guardado correctamente (Demo)' };
  }

  getInitialDemoDB() {
    return {
      periodos: [{ id: 1, año: 2024, estado: 'Abierto' }, { id: 2, año: 2025, estado: 'Abierto' }, { id: 3, año: 2026, estado: 'Abierto' }],
      cuentas: [
        { id: 1, nombre: 'Efectivo', moneda: 'ARS', saldoInicial: 5000, activa: true },
        { id: 2, nombre: 'Banco Galicia', moneda: 'ARS', saldoInicial: 150000, activa: true },
        { id: 3, nombre: 'Caja Ahorro USD', moneda: 'USD', saldoInicial: 100, activa: true }
      ],
      tiposIngreso: [{ id: 1, nombre: 'Sueldo' }, { id: 2, nombre: 'Venta' }, { id: 3, nombre: 'Regalo' }],
      formasPago: [{ id: 1, nombre: 'Efectivo' }, { id: 2, nombre: 'Débito' }, { id: 3, nombre: 'Transferencia' }, { id: 4, nombre: 'Crédito' }],
      categorias: [
        { id: 1, nombre: 'Comida', icono: '🍔' },
        { id: 2, nombre: 'Transporte', icono: '🚗' },
        { id: 3, nombre: 'Servicios', icono: '💡' },
        { id: 4, nombre: 'Ocio', icono: '🎬' }
      ],
      gastos: [],
      ingresos: [],
      transferencias: []
    };
  }
}

export const api = new AppAPI();

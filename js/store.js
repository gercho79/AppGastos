import { api } from './api.js';
import { showToast, toggleLoading } from './utils.js';

class AppStore {
  constructor() {
    this.state = {
      periodos: [], cuentas: [], tiposIngreso: [], formasPago: [],
      categorias: [], gastos: [], ingresos: [], transferencias: [],
      servicios: [],
      isLoading: false, initialized: false
    };
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => this.listeners = this.listeners.filter(l => l !== listener);
  }

  notify() { this.listeners.forEach(listener => listener(this.state)); }

  async init() {
    if (this.state.initialized) return;
    await this.refreshAll();
    this.state.initialized = true;
    this.notify();
  }

  async refreshAll() {
    this.state.isLoading = true;
    this.notify();
    try {
      const response = await api.fetch('getall');
      if (response.status === 'success') {
        this.state = { ...this.state, ...response.data, isLoading: false };
        console.log('--- DEBUG DE VINCULACIÓN ---');
        console.log('Cuentas encontradas:', this.state.cuentas.length);
        console.log('Servicios encontrados:', this.state.servicios.length);
      }
    } catch (error) {
      this.state.isLoading = false;
    }
    this.notify();
  }

  _parseNumber(val) {
    if (val === undefined || val === null || val === '') return 0;
    let s = val.toString().trim()
      .replace(/[$\s]/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  getBalances() {
    const balances = {};
    const idToName = {}; // Mapa para vincular IDs con Nombres

    // 1. Inicializar Cuentas
    this.state.cuentas.forEach(c => {
      const name = (c.nombre || '').toString().trim().toUpperCase();
      const id = (c.id || '').toString().trim();
      if (!name) return;
      
      balances[name] = {
        displayName: c.nombre,
        moneda: (c.moneda || 'ARS').toUpperCase(),
        saldo: this._parseNumber(c.saldoInicial)
      };
      if (id) idToName[id] = name;
    });

    // Función auxiliar para obtener el nombre de cuenta desde nombre o ID
    const getAccName = (val) => {
      if (!val) return '';
      const v = val.toString().trim();
      const vUpper = v.toUpperCase();
      if (balances[vUpper]) return vUpper; // Es un nombre
      if (idToName[v]) return idToName[v]; // Es un ID
      return '';
    };

    // 2. Ingresos
    this.state.ingresos.forEach(i => {
      const accVal = i.cuentaDestino || i.cuentadestino || i.cuenta;
      const accName = getAccName(accVal);
      const imp = this._parseNumber(i.importe);
      if (balances[accName]) {
        balances[accName].saldo += imp;
        console.log(`+ Ingreso en ${accName}: ${imp}`);
      }
    });

    // 3. Gastos
    this.state.gastos.forEach(g => {
      const accVal = g.cuentaOrigen || g.cuentaorigen || g.cuenta;
      const accName = getAccName(accVal);
      const imp = this._parseNumber(g.importe);
      if (balances[accName]) {
        balances[accName].saldo -= imp;
        console.log(`- Gasto en ${accName}: ${imp}`);
      }
    });

    // 4. Transferencias
    this.state.transferencias.forEach(t => {
      const oriName = getAccName(t.cuentaOrigen || t.cuentaorigen);
      const desName = getAccName(t.cuentaDestino || t.cuentadestino);
      const imp = this._parseNumber(t.importe);

      if (balances[oriName]) balances[oriName].saldo -= imp;
      if (balances[desName]) {
        const factor = this._parseNumber(t.tipoCambio) || 1;
        const add = t.tipoCambio ? (imp / factor) : imp;
        balances[desName].saldo += add;
      }
    });

    return balances;
  }

  getGastosByCategory(month, year) {
    const summary = {};
    this.state.gastos.forEach(g => {
      const d = new Date(g.fecha);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const cat = g.categoria || 'Otros';
        summary[cat] = (summary[cat] || 0) + this._parseNumber(g.importe);
      }
    });
    return summary;
  }

  async _performAction(action, body, successMsg) {
    toggleLoading(true);
    try {
      const res = await api.post(action, { id: Date.now(), ...body });
      if (res.status === 'success') {
        await this.refreshAll();
        showToast(successMsg);
        return true;
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      toggleLoading(false);
    }
    return false;
  }

  async addGasto(g) { return this._performAction('addGasto', g, 'Gasto guardado'); }
  async addIngreso(i) { return this._performAction('addIngreso', i, 'Ingreso guardado'); }
  async addTransferencia(t) { return this._performAction('addTransferencia', t, 'Transferencia lista'); }
  async addPeriodo(p) { return this._performAction('addPeriodo', p, 'Ejercicio abierto'); }
}

export const store = new AppStore();

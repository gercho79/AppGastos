import { api } from './api.js';
import { showToast, toggleLoading } from './utils.js';

class AppStore {
  constructor() {
    this.state = {
      periodos: [], cuentas: [], tiposIngreso: [], formasPago: [],
      categorias: [], gastos: [], ingresos: [], transferencias: [], servicios: [],
      isLoading: false, initialized: false
    };
    this.listeners = [];
  }

  subscribe(l) { this.listeners.push(l); return () => this.listeners = this.listeners.filter(x => x !== l); }
  notify() { this.listeners.forEach(l => l(this.state)); }

  async init() {
    if (this.state.initialized) return;
    await this.refreshAll();
    this.state.initialized = true;
  }

  async refreshAll() {
    this.state.isLoading = true;
    this.notify();
    try {
      const res = await api.fetch('getall');
      if (res.status === 'success') {
        this.state = { ...this.state, ...res.data, isLoading: false };
      }
    } catch (e) {
      this.state.isLoading = false;
    }
    this.notify();
  }

  _n(val) {
    if (val === null || val === undefined || val === '') return 0;
    // If already a number, return directly
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    const s = val.toString().replace(/[$\s]/g, '').trim();
    if (s === '') return 0;

    // Argentine format: dots as thousands, comma as decimal (e.g. "5.551.411,09")
    if (s.includes(',')) {
      const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
      return isNaN(n) ? 0 : n;
    }

    // Count dots to distinguish decimal from thousands
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount <= 1) {
      // Single dot or no dot = standard decimal format (e.g. "5551411.09")
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }

    // Multiple dots = thousands separators without decimal (e.g. "5.551.411")
    const n = parseFloat(s.replace(/\./g, ''));
    return isNaN(n) ? 0 : n;
  }

  getBalances() {
    const balances = {};
    const idToName = {};

    this.state.cuentas.forEach(c => {
      const name = (c.nombre || '').toString().trim().toUpperCase();
      if (!name) return;
      balances[name] = {
        displayName: c.nombre,
        moneda: (c.moneda || 'ARS').toUpperCase(),
        saldoInicial: this._n(c.saldoinicial),
        totalIngresos: 0,
        totalGastos: 0,
        totalTransIn: 0,
        totalTransOut: 0,
        saldo: this._n(c.saldoinicial)
      };
      if (c.id) idToName[c.id.toString()] = name;
    });

    const getName = (v) => {
      if (!v) return '';
      const s = v.toString().trim();
      return balances[s.toUpperCase()] ? s.toUpperCase() : (idToName[s] || '');
    };

    this.state.ingresos.forEach(i => {
      const acc = getName(i.cuentadestino);
      if (balances[acc]) {
        const monto = this._n(i.importe);
        balances[acc].totalIngresos += monto;
        balances[acc].saldo += monto;
      }
    });

    this.state.gastos.forEach(g => {
      const acc = getName(g.cuentaorigen);
      if (balances[acc]) {
        const monto = this._n(g.importe);
        balances[acc].totalGastos += monto;
        balances[acc].saldo -= monto;
      }
    });

    this.state.transferencias.forEach(t => {
      const ori = getName(t.cuentaorigen);
      const des = getName(t.cuentadestino);
      const imp = this._n(t.importe);
      if (balances[ori]) {
        balances[ori].totalTransOut += imp;
        balances[ori].saldo -= imp;
      }
      if (balances[des]) {
        const factor = this._n(t.tipocambio) || 1;
        const received = t.tipocambio ? (imp / factor) : imp;
        balances[des].totalTransIn += received;
        balances[des].saldo += received;
      }
    });

    return balances;
  }

  async _act(action, body, msg) {
    toggleLoading(true);
    try {
      const res = await api.post(action, { id: Date.now(), ...body });
      if (res && res.status === 'success') {
        await this.refreshAll();
        showToast(msg);
        return true;
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      toggleLoading(false);
    }
    return false;
  }

  async addGasto(g) { return this._act('addGasto', g, 'Gasto guardado'); }
  async addIngreso(i) { return this._act('addIngreso', i, 'Ingreso guardado'); }
  async addTransferencia(t) { return this._act('addTransferencia', t, 'Transferencia lista'); }
  async addCuenta(c) { return this._act('addCuenta', c, 'Cuenta creada'); }
  async addTipoIngreso(n) { return this._act('addTipoIngreso', { nombre: n }, 'Agregado'); }
  async deleteTipoIngreso(id) { return this._act('deleteTipoIngreso', { id }, 'Eliminado'); }
  async addCategoria(c) { return this._act('addCategoria', c, 'Categoría agregada'); }
  async deleteCategoria(id) { return this._act('deleteCategoria', { id }, 'Eliminado'); }
  async addFormaPago(n) { return this._act('addFormaPago', { nombre: n }, 'Agregado'); }
  async deleteFormaPago(id) { return this._act('deleteFormaPago', { id }, 'Eliminado'); }
  async addServicio(n) { return this._act('addServicio', { nombre: n, activo: 'TRUE' }, 'Servicio guardado'); }
  async deleteServicio(id) { return this._act('deleteServicio', { id }, 'Eliminado'); }
  async addPeriodo(p) { return this._act('addPeriodo', p, 'Ejercicio abierto'); }

  getGastosByCategory() {
    const categories = {};
    this.state.gastos.forEach(g => {
      const cat = g.categoria || 'Sin Categoría';
      categories[cat] = (categories[cat] || 0) + this._n(g.importe);
    });
    return categories;
  }
}

export const store = new AppStore();

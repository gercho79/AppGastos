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
    if (!val) return 0;
    const s = val.toString().replace(/[$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  getBalances() {
    const balances = {};
    const idToName = {};

    this.state.cuentas.forEach(c => {
      const name = (c.nombre || '').toString().trim().toUpperCase();
      if (!name) return;
      balances[name] = { displayName: c.nombre, moneda: (c.moneda || 'ARS').toUpperCase(), saldo: this._n(c.saldoinicial) };
      if (c.id) idToName[c.id.toString()] = name;
    });

    const getName = (v) => {
      if (!v) return '';
      const s = v.toString().trim();
      return balances[s.toUpperCase()] ? s.toUpperCase() : (idToName[s] || '');
    };

    this.state.ingresos.forEach(i => {
      const acc = getName(i.cuentadestino);
      if (balances[acc]) balances[acc].saldo += this._n(i.importe);
    });

    this.state.gastos.forEach(g => {
      const acc = getName(g.cuentaorigen);
      if (balances[acc]) balances[acc].saldo -= this._n(g.importe);
    });

    this.state.transferencias.forEach(t => {
      const ori = getName(t.cuentaorigen);
      const des = getName(t.cuentadestino);
      const imp = this._n(t.importe);
      if (balances[ori]) balances[ori].saldo -= imp;
      if (balances[des]) {
        const factor = this._n(t.tipocambio) || 1;
        balances[des].saldo += t.tipocambio ? (imp / factor) : imp;
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

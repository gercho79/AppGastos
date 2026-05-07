import { api } from './api.js';
import { showToast, toggleLoading } from './utils.js';

class AppStore {
  constructor() {
    this.state = {
      periodos: [], cuentas: [], tiposIngreso: [], formasPago: [],
      categorias: [], gastos: [], ingresos: [], transferencias: [],
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
        console.log('Datos cargados:', this.state);
      }
    } catch (error) {
      this.state.isLoading = false;
      console.error('Error de carga:', error);
    }
    this.notify();
  }

  // --- Selectors ---
  getBalances() {
    const balances = {};

    // 1. Inicializar con saldos base
    this.state.cuentas.forEach(c => {
      const name = (c.nombre || '').toString().trim().toUpperCase();
      if (!name) return;
      balances[name] = {
        displayName: c.nombre, // Para mostrarlo bonito en la UI
        moneda: (c.moneda || 'ARS').toUpperCase(),
        saldo: parseFloat(c.saldoInicial || 0)
      };
    });

    // 2. Sumar Ingresos
    this.state.ingresos.forEach(i => {
      const accountName = (i.cuentaDestino || i.cuentadestino || '').toString().trim().toUpperCase();
      if (balances[accountName]) {
        balances[accountName].saldo += parseFloat(i.importe || 0);
      }
    });

    // 3. Restar Gastos
    this.state.gastos.forEach(g => {
      const accountName = (g.cuentaOrigen || g.cuentaorigen || '').toString().trim().toUpperCase();
      if (balances[accountName]) {
        balances[accountName].saldo -= parseFloat(g.importe || 0);
      }
    });

    // 4. Procesar Transferencias
    this.state.transferencias.forEach(t => {
      const origen = (t.cuentaOrigen || t.cuentaorigen || '').toString().trim().toUpperCase();
      const destino = (t.cuentaDestino || t.cuentadestino || '').toString().trim().toUpperCase();

      if (balances[origen]) {
        balances[origen].saldo -= parseFloat(t.importe || 0);
      }
      if (balances[destino]) {
        const amountToAdd = t.tipoCambio ? (parseFloat(t.importe) / parseFloat(t.tipoCambio)) : parseFloat(t.importe);
        balances[destino].saldo += (amountToAdd || 0);
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
        summary[cat] = (summary[cat] || 0) + parseFloat(g.importe || 0);
      }
    });
    return summary;
  }

  // --- Actions ---
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

  async addGasto(gasto) { return this._performAction('addGasto', gasto, 'Gasto guardado'); }
  async addIngreso(ingreso) { return this._performAction('addIngreso', ingreso, 'Ingreso guardado'); }
  async addTransferencia(t) { return this._performAction('addTransferencia', t, 'Transferencia lista'); }
  async addCuenta(c) { return this._performAction('addCuenta', c, 'Cuenta creada'); }
  async addTipoIngreso(n) { return this._performAction('addTipoIngreso', { nombre: n }, 'Agregado'); }
  async deleteTipoIngreso(id) { return this._performAction('deleteTipoIngreso', { id }, 'Eliminado'); }
  async addCategoria(c) { return this._performAction('addCategoria', c, 'Categoría agregada'); }
  async deleteCategoria(id) { return this._performAction('deleteCategoria', { id }, 'Eliminado'); }
  async addFormaPago(n) { return this._performAction('addFormaPago', { nombre: n }, 'Agregado'); }
  async deleteFormaPago(id) { return this._performAction('deleteFormaPago', { id }, 'Eliminado'); }
}

export const store = new AppStore();

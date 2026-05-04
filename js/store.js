import { api } from './api.js';
import { showToast } from './utils.js';

class AppStore {
  constructor() {
    this.state = {
      periodos: [],
      cuentas: [],
      tiposIngreso: [],
      formasPago: [],
      categorias: [],
      gastos: [],
      ingresos: [],
      transferencias: [],
      isLoading: false,
      initialized: false
    };
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

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
      const response = await api.fetch('getAll');
      if (response.status === 'success') {
        this.state = { ...this.state, ...response.data, isLoading: false };
      }
    } catch (error) {
      this.state.isLoading = false;
      console.error('Store Refresh Error:', error);
    }
    
    this.notify();
  }

  // --- Selectors ---

  getBalances() {
    const balances = {};
    
    // Initial balances
    this.state.cuentas.forEach(c => {
      balances[c.nombre] = {
        id: c.id,
        moneda: c.moneda,
        saldo: parseFloat(c.saldoInicial) || 0
      };
    });

    // Add ingresos
    this.state.ingresos.forEach(i => {
      if (balances[i.cuentaDestino]) {
        balances[i.cuentaDestino].saldo += parseFloat(i.importe);
      }
    });

    // Subtract gastos
    this.state.gastos.forEach(g => {
      if (balances[g.cuentaOrigen]) {
        balances[g.cuentaOrigen].saldo -= parseFloat(g.importe);
      }
    });

    // Handle transferencias
    this.state.transferencias.forEach(t => {
      if (balances[t.cuentaOrigen]) {
        balances[t.cuentaOrigen].saldo -= parseFloat(t.importe);
      }
      
      if (balances[t.cuentaDestino]) {
        // If it's a USD purchase, we use the type change
        const amountToAdd = t.tipoCambio ? t.importe / t.tipoCambio : t.importe;
        balances[t.cuentaDestino].saldo += parseFloat(amountToAdd);
      }
    });

    return balances;
  }

  getFilteredGastos(month, year) {
    return this.state.gastos.filter(g => {
      const d = new Date(g.fecha);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  getGastosByCategory(month, year) {
    const filtered = this.getFilteredGastos(month, year);
    const summary = {};
    
    filtered.forEach(g => {
      summary[g.categoria] = (summary[g.categoria] || 0) + parseFloat(g.importe);
    });
    
    return summary;
  }

  // --- Actions ---

  async addGasto(gasto) {
    const res = await api.post('addGasto', gasto);
    if (res.status === 'success') {
      await this.refreshAll();
      showToast('Gasto registrado');
    }
  }

  async addIngreso(ingreso) {
    const res = await api.post('addIngreso', ingreso);
    if (res.status === 'success') {
      await this.refreshAll();
      showToast('Ingreso registrado');
    }
  }

  async addTransferencia(trans) {
    const res = await api.post('addTransferencia', trans);
    if (res.status === 'success') {
      await this.refreshAll();
      showToast('Transferencia realizada');
    }
  }
}

export const store = new AppStore();

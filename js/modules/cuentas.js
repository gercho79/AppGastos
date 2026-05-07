import { store } from '../store.js';
import { api } from '../api.js';
import { Modal } from '../components.js';
import { formatCurrency } from '../utils.js';

export const CuentasView = {
  title: 'Mis Cuentas',
  render(container) {
    const balances = store.getBalances();
    
    container.innerHTML = `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2>Gestión de Cuentas</h2>
        <button id="add-cuenta-btn" class="btn btn-primary">Nueva Cuenta</button>
      </div>

      <div class="list-container">
        ${store.state.cuentas.map(c => {
          const balance = balances[c.nombre?.toUpperCase()]?.saldo || 0;
          return `
            <div class="item-card">
              <div class="item-info">
                <h4>${c.nombre}</h4>
                <p>Moneda: ${c.moneda} | ${c.activa ? 'Activa' : 'Inactiva'}</p>
              </div>
              <div class="item-value ${balance < 0 ? 'negative' : 'positive'}" style="font-weight: 700;">
                ${formatCurrency(balance, c.moneda)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('add-cuenta-btn').addEventListener('click', () => this.showAddModal());
  },

  showAddModal() {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nombre de la Cuenta</label>
        <input type="text" id="c-nombre" class="form-input" placeholder="Ej: Mercado Pago" required>
      </div>
      <div class="form-group">
        <label class="form-label">Moneda</label>
        <select id="c-moneda" class="form-input">
          <option value="ARS">Pesos (ARS)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Saldo Inicial</label>
        <input type="number" id="c-saldo" class="form-input" value="0" step="0.01">
      </div>
      <button type="submit" class="btn btn-primary btn-full">Crear Cuenta</button>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await store.addCuenta({
        nombre: document.getElementById('c-nombre').value,
        moneda: document.getElementById('c-moneda').value,
        saldoInicial: document.getElementById('c-saldo').value,
        activa: true
      });
      Modal.hide();
    });

    Modal.show('Nueva Cuenta', form);
  }
};

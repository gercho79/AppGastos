import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const IngresosView = {
  title: 'Ingresos y Transferencias',
  render(container) {
    container.innerHTML = `
      <div class="view-header" style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
        <button id="add-ingreso-btn" class="btn btn-primary">Nuevo Ingreso</button>
        <button id="add-trans-btn" class="btn btn-ghost">Transferencia</button>
        <button id="add-usd-btn" class="btn btn-ghost">Compra USD</button>
      </div>

      <h3>Movimientos Recientes</h3>
      <div class="list-container" id="ingresos-list" style="margin-top: 16px;">
        ${this.renderList()}
      </div>
    `;

    document.getElementById('add-ingreso-btn').addEventListener('click', () => this.showIngresoModal());
    document.getElementById('add-trans-btn').addEventListener('click', () => this.showTransferModal());
    document.getElementById('add-usd-btn').addEventListener('click', () => this.showUsdModal());
  },

  renderList() {
    const movimientos = [
      ...store.state.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ...store.state.transferencias.map(t => ({ ...t, tipo: 'transferencia' }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (movimientos.length === 0) {
      return `<div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-secondary);">No hay movimientos registrados.</div>`;
    }

    return movimientos.map(m => `
      <div class="item-card">
        <div class="item-info">
          <h4>${m.tipo === 'ingreso' ? (m.tipoIngreso || 'Ingreso') : 'Transferencia'}</h4>
          <p>${formatDate(m.fecha)} | ${m.tipo === 'ingreso' ? m.cuentaDestino : `${m.cuentaOrigen} ➔ ${m.cuentaDestino}`}</p>
        </div>
        <div class="item-value ${m.tipo === 'ingreso' ? 'positive' : ''}" style="font-weight: 700;">
          ${m.tipo === 'ingreso' ? '+' : ''}${formatCurrency(m.importe, 'ARS')}
        </div>
      </div>
    `).join('');
  },

  showIngresoModal() {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="i-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe</label>
        <input type="number" id="i-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino</label>
        <select id="i-cuenta" class="form-input" required>
          ${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Ingreso</label>
        <select id="i-tipo" class="form-input" required>
          ${store.state.tiposIngreso.map(t => `<option value="${t.nombre}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Registrar Ingreso</button>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await store.addIngreso({
        fecha: document.getElementById('i-fecha').value,
        importe: document.getElementById('i-importe').value,
        cuentaDestino: document.getElementById('i-cuenta').value,
        tipoIngreso: document.getElementById('i-tipo').value,
        periodo: new Date(document.getElementById('i-fecha').value).getFullYear()
      });
      Modal.hide();
      this.render(document.getElementById('page-content'));
    });

    Modal.show('Nuevo Ingreso', form);
  },

  showTransferModal() {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="t-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe (ARS)</label>
        <input type="number" id="t-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen</label>
        <select id="t-origen" class="form-input" required>
          ${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino</label>
        <select id="t-destino" class="form-input" required>
          ${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Realizar Transferencia</button>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await store.addTransferencia({
        fecha: document.getElementById('t-fecha').value,
        importe: document.getElementById('t-importe').value,
        cuentaOrigen: document.getElementById('t-origen').value,
        cuentaDestino: document.getElementById('t-destino').value
      });
      Modal.hide();
      this.render(document.getElementById('page-content'));
    });

    Modal.show('Transferencia', form);
  },

  showUsdModal() {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Importe Pesos (ARS)</label>
        <input type="number" id="u-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Cambio (ARS/USD)</label>
        <input type="number" id="u-tc" class="form-input" step="0.01" placeholder="Ej: 1100" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen (ARS)</label>
        <select id="u-origen" class="form-input" required>
          ${store.state.cuentas.filter(c => c.moneda === 'ARS').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino (USD)</label>
        <select id="u-destino" class="form-input" required>
          ${store.state.cuentas.filter(c => c.moneda === 'USD').map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Confirmar Compra USD</button>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await store.addTransferencia({
        fecha: new Date().toISOString().split('T')[0],
        importe: document.getElementById('u-importe').value,
        tipoCambio: document.getElementById('u-tc').value,
        cuentaOrigen: document.getElementById('u-origen').value,
        cuentaDestino: document.getElementById('u-destino').value,
        descripcion: 'Compra de USD'
      });
      Modal.hide();
      this.render(document.getElementById('page-content'));
    });

    Modal.show('Compra de USD', form);
  }
};

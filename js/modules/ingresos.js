import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const IngresosView = {
  title: 'Ingresos',
  render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h2>Ingresos / Transferencias</h2>
        <div style="display:flex; gap:10px;">
          <button id="add-trans-btn" class="btn btn-ghost">Transferencia</button>
          <button id="add-ingreso-btn" class="btn btn-primary">+ Nuevo Ingreso</button>
        </div>
      </div>
      <div class="list-container" id="ingresos-list">
        ${this.renderList()}
      </div>
    `;
    document.getElementById('add-ingreso-btn').onclick = () => this.showIngresoModal();
    document.getElementById('add-trans-btn').onclick = () => this.showTransModal();
  },

  renderList() {
    const list = [
      ...store.state.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ...store.state.transferencias.map(t => ({ ...t, tipo: 'trans' }))
    ].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    if (list.length === 0) return '<p class="stat-label" style="text-align:center; padding:40px;">Sin movimientos</p>';
    
    return list.map(m => `
      <div class="item-card">
        <div class="item-info">
          <h4>${m.tipo === 'ingreso' ? (m.tipoingreso || 'Ingreso') : 'Transferencia'}</h4>
          <p>${formatDate(m.fecha)} | ${m.tipo === 'ingreso' ? (m.cuentadestino || 'S/C') : `${m.cuentaorigen || '?'} ➔ ${m.cuentadestino || '?'}`}</p>
        </div>
        <div class="item-value ${m.tipo === 'ingreso' ? 'positive' : ''}" style="font-weight:700;">
          ${m.tipo === 'ingreso' ? '+' : ''}${formatCurrency(store._n(m.importe), 'ARS')}
        </div>
      </div>
    `).join('');
  },

  showIngresoModal() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="i-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required></div>
      <div class="form-group"><label class="form-label">Importe</label><input type="number" id="i-importe" class="form-input" step="0.01" required></div>
      <div class="form-group"><label class="form-label">Cuenta Destino</label><select id="i-cuenta" class="form-input" required>${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Tipo de Ingreso</label><select id="i-tipo" class="form-input" required>${store.state.tiposIngreso.map(t => `<option value="${t.nombre}">${t.nombre}</option>`).join('')}</select></div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:15px;">Guardar Ingreso</button>
    `;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        fecha: form.querySelector('#i-fecha').value,
        importe: form.querySelector('#i-importe').value,
        cuentadestino: form.querySelector('#i-cuenta').value,
        tipoingreso: form.querySelector('#i-tipo').value,
        periodo: new Date(form.querySelector('#i-fecha').value).getFullYear()
      };
      if (await store.addIngreso(data)) { Modal.hide(); this.render(this.container); }
    };
    Modal.show('Nuevo Ingreso', form);
  },

  showTransModal() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="t-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required></div>
      <div class="form-group"><label class="form-label">Importe (Desde origen)</label><input type="number" id="t-importe" class="form-input" step="0.01" required></div>
      <div class="form-group"><label class="form-label">Cuenta Origen</label><select id="t-ori" class="form-input" required>${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Cuenta Destino</label><select id="t-des" class="form-input" required>${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Tipo de Cambio (Opcional)</label><input type="number" id="t-tc" class="form-input" step="0.0001" placeholder="Solo para USD"></div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:15px;">Realizar Transferencia</button>
    `;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        fecha: form.querySelector('#t-fecha').value,
        importe: form.querySelector('#t-importe').value,
        cuentaorigen: form.querySelector('#t-ori').value,
        cuentadestino: form.querySelector('#t-des').value,
        tipocambio: form.querySelector('#t-tc').value
      };
      if (await store.addTransferencia(data)) { Modal.hide(); this.render(this.container); }
    };
    Modal.show('Transferencia', form);
  }
};

import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const GastosView = {
  title: 'Gastos',
  render(container) {
    container.innerHTML = `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2>Registro de Gastos</h2>
        <button id="add-gasto-btn" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Gasto
        </button>
      </div>

      <div class="list-container" id="gastos-list">
        ${this.renderList()}
      </div>
    `;

    document.getElementById('add-gasto-btn').onclick = () => this.showAddModal();
  },

  renderList() {
    const gastos = store.state.gastos;
    if (gastos.length === 0) {
      return `<div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-secondary);">No hay gastos registrados.</div>`;
    }

    return gastos.map(g => `
      <div class="item-card">
        <div class="item-info">
          <h4>${g.categoria} - ${g.descripcion || 'Sin descripción'}</h4>
          <p>${formatDate(g.fecha)} | ${g.cuentaOrigen} | ${g.esServicio === 'TRUE' || g.esServicio === true ? '✅ Servicio' : '💸 Gasto'}</p>
        </div>
        <div class="item-value negative" style="font-weight: 700;">
          -${formatCurrency(g.importe, store.state.cuentas.find(c => c.nombre === g.cuentaOrigen)?.moneda || 'ARS')}
        </div>
      </div>
    `).join('');
  },

  showAddModal() {
    const form = document.createElement('form');
    form.id = 'gasto-form';
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="g-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe</label>
        <input type="number" id="g-importe" class="form-input" step="0.01" placeholder="0.00" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen</label>
        <select id="g-cuenta" class="form-input" required>
          <option value="">Seleccionar cuenta...</option>
          ${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre} (${c.moneda})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría</label>
        <select id="g-categoria" class="form-input" required>
          ${store.state.categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin: 15px 0;">
        <input type="checkbox" id="g-esservicio" style="width: 18px; height: 18px; cursor: pointer;">
        <label for="g-esservicio" style="margin: 0; cursor: pointer;">¿Es un Servicio?</label>
      </div>

      <div id="servicio-select-container" class="form-group" style="display: none;">
        <label class="form-label">Servicio</label>
        <select id="g-servicio" class="form-input">
          <option value="">Seleccionar servicio...</option>
          ${store.state.servicios.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Forma de Pago</label>
        <select id="g-formapago" class="form-input" required>
          ${store.state.formasPago.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción / Nota</label>
        <input type="text" id="g-descripcion" class="form-input" placeholder="Ej: Pago de luz">
      </div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top: 10px;">Guardar Gasto</button>
    `;

    // Lógica para mostrar/ocultar el select de servicios
    const checkServicio = form.querySelector('#g-esservicio');
    const containerServicio = form.querySelector('#servicio-select-container');
    checkServicio.onchange = () => {
      containerServicio.style.display = checkServicio.checked ? 'block' : 'none';
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const isServicio = document.getElementById('g-esservicio').checked;
      const servicioSeleccionado = document.getElementById('g-servicio').value;
      let desc = document.getElementById('g-descripcion').value;
      
      // Si es servicio y no puso nota, usamos el nombre del servicio como descripción
      if (isServicio && !desc && servicioSeleccionado) {
        desc = servicioSeleccionado;
      }

      const gasto = {
        fecha: document.getElementById('g-fecha').value,
        importe: document.getElementById('g-importe').value,
        cuentaOrigen: document.getElementById('g-cuenta').value,
        categoria: document.getElementById('g-categoria').value,
        formaPago: document.getElementById('g-formapago').value,
        esServicio: isServicio ? 'TRUE' : 'FALSE',
        descripcion: desc,
        periodo: new Date(document.getElementById('g-fecha').value).getFullYear()
      };
      
      await store.addGasto(gasto);
      Modal.hide();
      this.render(container);
    };

    Modal.show('Nuevo Gasto', form);
  }
};

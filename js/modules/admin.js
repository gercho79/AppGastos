import { store } from '../store.js';
import { Modal } from '../components.js';

export const AdminView = {
  title: 'Administración',
  render(container) {
    this.container = container;
    
    const periodosHtml = store.state.periodos.map(p => `
      <div class="item-card" style="padding: 10px 16px;">
        <span>Ejercicio ${p.anio || 'Desconocido'}</span>
        <span class="badge" style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${p.estado}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="admin-sections">
        
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Apertura de Período</h3>
            <button id="add-periodo-btn" class="btn btn-primary btn-sm">Abrir Ejercicio 2026</button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${periodosHtml}
          </div>
        </div>

        <div class="admin-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
          <div class="stat-card">
            <div class="flex-between">
              <h3>Tipos de Ingreso</h3>
              <button id="add-tipo-ingreso-btn" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div class="list-container">${this.renderList(store.state.tiposIngreso, 'tipo')}</div>
          </div>

          <div class="stat-card">
            <div class="flex-between">
              <h3>Categorías</h3>
              <button id="add-categoria-btn" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div class="list-container">${this.renderList(store.state.categorias, 'cat')}</div>
          </div>

          <div class="stat-card">
            <div class="flex-between">
              <h3>Formas de Pago</h3>
              <button id="add-forma-pago-btn" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div class="list-container">${this.renderList(store.state.formasPago, 'forma')}</div>
          </div>

          <div class="stat-card">
            <div class="flex-between">
              <h3>Servicios</h3>
              <button id="add-servicio-btn" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div class="list-container">${this.renderList(store.state.servicios, 'servicio')}</div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  },

  renderList(items, type) {
    if (!items || items.length === 0) return '<p class="stat-label">Sin registros</p>';
    return items.map(item => `
      <div class="item-card" style="padding: 8px 12px; margin-bottom: 8px;">
        <span>${item.nombre}</span>
        <button class="delete-btn" data-type="${type}" data-id="${item.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    `).join('');
  },

  setupEventListeners() {
    const btnMap = {
      'add-periodo-btn': async () => {
        if(confirm('¿Abrir el ejercicio 2026?')) {
          await store.addPeriodo({ anio: 2026, estado: 'Abierto' });
          this.render(this.container);
        }
      },
      'add-tipo-ingreso-btn': () => this.showSimpleForm('Nuevo Tipo', async (v) => await store.addTipoIngreso(v)),
      'add-categoria-btn': () => this.showSimpleForm('Nueva Categoría', async (v) => await store.addCategoria({ nombre: v })),
      'add-forma-pago-btn': () => this.showSimpleForm('Nueva Forma de Pago', async (v) => await store.addFormaPago(v)),
      'add-servicio-btn': () => this.showSimpleForm('Nuevo Servicio', async (v) => await store.addServicio(v))
    };

    Object.entries(btnMap).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    });

    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Seguro?')) return;
        const { type, id } = btn.dataset;
        if (type === 'tipo') await store.deleteTipoIngreso(id);
        if (type === 'cat') await store.deleteCategoria(id);
        if (type === 'forma') await store.deleteFormaPago(id);
        if (type === 'servicio') await store.deleteServicio(id);
        this.render(this.container);
      };
    });
  },

  showSimpleForm(title, onSave) {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input type="text" id="simple-name" class="form-input" required placeholder="Escribe aquí...">
      </div>
      <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="modal-save-btn" style="flex: 1;">Guardar</button>
      </div>
    `;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const val = form.querySelector('#simple-name').value.trim();
      if (!val) return;

      const saveBtn = form.querySelector('#modal-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      try {
        const success = await onSave(val);
        if (success !== false) {
          Modal.hide();
          this.render(this.container);
        }
      } catch (err) {
        console.error(err);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
      }
    };

    Modal.show(title, form);
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => Modal.hide();
    setTimeout(() => {
      const input = document.getElementById('simple-name');
      if (input) input.focus();
    }, 200);
  }
};

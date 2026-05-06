import { store } from '../store.js';
import { Modal } from '../components.js';
import { api } from '../api.js';

export const AdminView = {
  title: 'Administración',
  render(container) {
    container.innerHTML = `
      <div class="admin-sections">
        
        <!-- Períodos -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Apertura de Período</h3>
            <button id="add-periodo-btn" class="btn btn-primary btn-sm">Abrir Ejercicio 2026</button>
          </div>
          <p class="stat-label">Define el año de ejercicio actual y futuros.</p>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.periodos.map(p => `
              <div class="item-card" style="padding: 10px 16px;">
                <span>Ejercicio ${p.año}</span>
                <span class="badge" style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${p.estado}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Tipos de Ingreso -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Tipos de Ingreso</h3>
            <button id="add-tipo-ingreso-btn" class="btn btn-ghost btn-sm" title="Agregar Tipo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.tiposIngreso.map(t => `
              <div class="item-card" style="padding: 10px 16px;">
                <span>${t.nombre}</span>
                <div class="item-actions">
                  <button class="edit-tipo-btn" data-id="${t.id}" data-nombre="${t.nombre}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="delete-tipo-btn" data-id="${t.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Categorías -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Categorías</h3>
            <button id="add-categoria-btn" class="btn btn-ghost btn-sm" title="Agregar Categoría">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.categorias.map(c => `
              <div class="item-card" style="padding: 10px 16px;">
                <div class="flex-center" style="gap: 12px;">
                  <span style="font-size: 1.2rem;">${c.icono || '📁'}</span>
                  <span>${c.nombre}</span>
                </div>
                <div class="item-actions">
                  <button class="edit-cat-btn" data-id="${c.id}" data-nombre="${c.nombre}" data-icono="${c.icono || ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="delete-cat-btn" data-id="${c.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="stat-card">
          <div class="flex-between">
            <h3>Formas de Pago</h3>
            <button id="add-forma-pago-btn" class="btn btn-ghost btn-sm" title="Agregar Forma de Pago">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y2="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.formasPago.map(f => `
              <div class="item-card" style="padding: 10px 16px;">
                <span>${f.nombre}</span>
                <div class="item-actions">
                  <button class="edit-forma-btn" data-id="${f.id}" data-nombre="${f.nombre}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="delete-forma-btn" data-id="${f.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    this.setupEventListeners(container);
  },

  setupEventListeners(container) {
    // Periodo
    document.getElementById('add-periodo-btn').onclick = async () => {
      await store.addPeriodo({ año: 2026, estado: 'Abierto' });
      this.render(container);
    };

    // Tipos de Ingreso - Agregar
    document.getElementById('add-tipo-ingreso-btn').onclick = () => {
      this.showTipoForm(container);
    };

    // Tipos de Ingreso - Editar/Eliminar
    container.querySelectorAll('.edit-tipo-btn').forEach(btn => {
      btn.onclick = () => {
        this.showTipoForm(container, { id: btn.dataset.id, nombre: btn.dataset.nombre });
      };
    });

    container.querySelectorAll('.delete-tipo-btn').forEach(btn => {
      btn.onclick = async () => {
        await store.deleteTipoIngreso(btn.dataset.id);
        this.render(container);
      };
    });

    // Categorías - Agregar
    document.getElementById('add-categoria-btn').onclick = () => {
      this.showCategoriaForm(container);
    };

    // Categorías - Editar/Eliminar
    container.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.onclick = () => {
        this.showCategoriaForm(container, { id: btn.dataset.id, nombre: btn.dataset.nombre, icono: btn.dataset.icono });
      };
    });

    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.onclick = async () => {
        await store.deleteCategoria(btn.dataset.id);
        this.render(container);
      };
    });

    // Formas de Pago - Agregar
    document.getElementById('add-forma-pago-btn').onclick = () => {
      this.showFormaPagoForm(container);
    };

    // Formas de Pago - Editar/Eliminar
    container.querySelectorAll('.edit-forma-btn').forEach(btn => {
      btn.onclick = () => {
        this.showFormaPagoForm(container, { id: btn.dataset.id, nombre: btn.dataset.nombre });
      };
    });

    container.querySelectorAll('.delete-forma-btn').forEach(btn => {
      btn.onclick = async () => {
        await store.deleteFormaPago(btn.dataset.id);
        this.render(container);
      };
    });
  },

  showTipoForm(container, data = null) {
    const isEdit = !!data;
    const content = `
      <form id="tipo-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre del Tipo de Ingreso</label>
          <input type="text" id="tipo-nombre" class="form-input" value="${data ? data.nombre : ''}" required placeholder="Ej: Sueldo, Regalo, Venta...">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </form>
    `;
    
    Modal.show(isEdit ? 'Editar Tipo de Ingreso' : 'Nuevo Tipo de Ingreso', content);
    
    document.getElementById('cancel-btn').onclick = () => Modal.hide();
    document.getElementById('tipo-form').onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('tipo-nombre').value;
      if (isEdit) {
        await store.updateTipoIngreso(data.id, nombre);
      } else {
        await store.addTipoIngreso(nombre);
      }
      Modal.hide();
      this.render(container);
    };
  },

  showCategoriaForm(container, data = null) {
    const isEdit = !!data;
    const content = `
      <form id="cat-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre de la Categoría</label>
          <input type="text" id="cat-nombre" class="form-input" value="${data ? data.nombre : ''}" required placeholder="Ej: Comida, Salud, Ocio...">
        </div>
        <div class="form-group">
          <label class="form-label">Emoji / Icono</label>
          <input type="text" id="cat-icono" class="form-input" value="${data ? data.icono : '📁'}" placeholder="Ej: 🍔, 🚗, 💡...">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </form>
    `;
    
    Modal.show(isEdit ? 'Editar Categoría' : 'Nueva Categoría', content);
    
    document.getElementById('cancel-btn').onclick = () => Modal.hide();
    document.getElementById('cat-form').onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('cat-nombre').value;
      const icono = document.getElementById('cat-icono').value;
      if (isEdit) {
        await store.updateCategoria(data.id, { nombre, icono });
      } else {
        await store.addCategoria({ nombre, icono });
      }
      Modal.hide();
      this.render(container);
    };
  },

  showFormaPagoForm(container, data = null) {
    const isEdit = !!data;
    const content = `
      <form id="forma-pago-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre de la Forma de Pago</label>
          <input type="text" id="forma-pago-nombre" class="form-input" value="${data ? data.nombre : ''}" required placeholder="Ej: Efectivo, Tarjeta, Transferencia...">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </form>
    `;
    
    Modal.show(isEdit ? 'Editar Forma de Pago' : 'Nueva Forma de Pago', content);
    
    document.getElementById('cancel-btn').onclick = () => Modal.hide();
    document.getElementById('forma-pago-form').onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('forma-pago-nombre').value;
      if (isEdit) {
        await store.updateFormaPago(data.id, nombre);
      } else {
        await store.addFormaPago(nombre);
      }
      Modal.hide();
      this.render(container);
    };
  }
};

import { store } from '../store.js';
import { Modal } from '../components.js';

export const AdminView = {
  title: 'Administración',
  render(container) {
    this.container = container;
    
    container.innerHTML = `
      <div class="admin-sections">
        
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Apertura de Período</h3>
            <button id="add-periodo-btn" class="btn btn-primary btn-sm">Abrir 2026</button>
          </div>
          <div class="list-container" style="margin-top: 16px;">
            ${store.state.periodos.map(p => `
              <div class="item-card" style="padding: 10px 16px;">
                <span>Ejercicio ${p.anio || 'N/A'}</span>
                <span class="badge" style="background:var(--success); color:white; padding:2px 8px; border-radius:10px; font-size:10px;">${p.estado}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="admin-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
          ${this._sec('Tipos de Ingreso', 'add-tipo-btn', store.state.tiposIngreso, 'tipo')}
          ${this._sec('Categorías', 'add-cat-btn', store.state.categorias, 'cat')}
          ${this._sec('Formas de Pago', 'add-forma-btn', store.state.formasPago, 'forma')}
          ${this._sec('Servicios', 'add-serv-btn', store.state.servicios, 'servicio')}
        </div>
      </div>
    `;

    this._ev();
  },

  _sec(title, btnId, items, type) {
    return `
      <div class="stat-card">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h3 style="margin:0;">${title}</h3>
          <button id="${btnId}" class="btn btn-ghost btn-sm">+</button>
        </div>
        <div class="list-container">
          ${(items || []).map(item => `
            <div class="item-card" style="padding: 8px 12px; margin-bottom: 8px;">
              <span>${item.nombre}</span>
              <button class="del-btn" data-type="${type}" data-id="${item.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          `).join('') || '<p class="stat-label">Sin registros</p>'}
        </div>
      </div>
    `;
  },

  _ev() {
    const sets = [
      { id: 'add-periodo-btn', fn: () => confirm('¿Abrir 2026?') && store.addPeriodo({ anio: 2026, estado: 'Abierto' }) },
      { id: 'add-tipo-btn', fn: () => this._form('Nuevo Tipo', (v) => store.addTipoIngreso(v)) },
      { id: 'add-cat-btn', fn: () => this._form('Nueva Categoría', (v) => store.addCategoria({ nombre: v })) },
      { id: 'add-forma-btn', fn: () => this._form('Nueva Forma de Pago', (v) => store.addFormaPago(v)) },
      { id: 'add-serv-btn', fn: () => this._form('Nuevo Servicio', (v) => store.addServicio(v)) }
    ];

    sets.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) el.onclick = async () => { if(await s.fn()) this.render(this.container); };
    });

    this.container.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminar?')) return;
        const { type, id } = btn.dataset;
        const actionMap = { tipo: 'deleteTipoIngreso', cat: 'deleteCategoria', forma: 'deleteFormaPago', servicio: 'deleteServicio' };
        if (await store[actionMap[type]](id)) this.render(this.container);
      };
    });
  },

  _form(title, onSave) {
    return new Promise((resolve) => {
      const form = document.createElement('form');
      form.className = 'modal-form';
      form.innerHTML = `
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" id="m-name" class="form-input" required autofocus>
        </div>
        <div class="modal-actions" style="margin-top:20px; display:flex; gap:10px;">
          <button type="button" class="btn btn-ghost" id="m-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="m-save" style="flex:1;">Guardar</button>
        </div>
      `;

      form.onsubmit = async (e) => {
        e.preventDefault();
        const val = form.querySelector('#m-name').value.trim();
        const btn = form.querySelector('#m-save');
        btn.disabled = true;
        btn.textContent = '...';
        const res = await onSave(val);
        Modal.hide();
        resolve(res);
      };

      Modal.show(title, form);
      document.getElementById('m-cancel').onclick = () => { Modal.hide(); resolve(false); };
    });
  }
};

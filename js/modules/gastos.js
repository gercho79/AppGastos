import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const GastosView = {
  title: 'Gastos',
  // Filter & sort state
  filters: { mes: '', categoria: '', cuenta: '' },
  sort: { field: 'fecha', dir: 'desc' },

  render(container) {
    this.container = container;
    const meses = this._getMeses();
    const categorias = [...new Set(store.state.gastos.map(g => g.categoria).filter(Boolean))].sort();
    const cuentas = [...new Set(store.state.gastos.map(g => g.cuentaorigen).filter(Boolean))].sort();

    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>Gastos</h2>
        <button id="add-gasto-btn" class="btn btn-primary">+ Nuevo Gasto</button>
      </div>

      <!-- Filtros -->
      <div class="filters-bar" id="gastos-filters">
        <select id="gf-mes" class="filter-select" title="Mes">
          <option value="">📅 Todos los meses</option>
          ${meses.map(m => `<option value="${m.value}" ${this.filters.mes === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select>
        <select id="gf-categoria" class="filter-select" title="Categoría">
          <option value="">🏷️ Todas las categorías</option>
          ${categorias.map(c => `<option value="${c}" ${this.filters.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select id="gf-cuenta" class="filter-select" title="Cuenta">
          <option value="">🏦 Todas las cuentas</option>
          ${cuentas.map(c => `<option value="${c}" ${this.filters.cuenta === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <div class="sort-controls">
          <select id="gf-sort-field" class="filter-select sort-select" title="Ordenar por">
            <option value="fecha" ${this.sort.field === 'fecha' ? 'selected' : ''}>📆 Fecha</option>
            <option value="importe" ${this.sort.field === 'importe' ? 'selected' : ''}>💰 Importe</option>
            <option value="categoria" ${this.sort.field === 'categoria' ? 'selected' : ''}>🏷️ Categoría</option>
          </select>
          <button id="gf-sort-dir" class="btn-sort" title="Cambiar orden">
            ${this.sort.dir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <button id="gf-clear" class="btn btn-ghost btn-sm" title="Limpiar filtros">✖ Limpiar</button>
      </div>

      <div id="gastos-count" class="list-count"></div>
      <div class="list-container" id="gastos-list">
        ${this.renderList()}
      </div>
    `;

    document.getElementById('add-gasto-btn').onclick = () => this.showAddModal();

    // Filter events
    document.getElementById('gf-mes').onchange = (e) => { this.filters.mes = e.target.value; this._refresh(); };
    document.getElementById('gf-categoria').onchange = (e) => { this.filters.categoria = e.target.value; this._refresh(); };
    document.getElementById('gf-cuenta').onchange = (e) => { this.filters.cuenta = e.target.value; this._refresh(); };
    document.getElementById('gf-sort-field').onchange = (e) => { this.sort.field = e.target.value; this._refresh(); };
    document.getElementById('gf-sort-dir').onclick = () => { this.sort.dir = this.sort.dir === 'desc' ? 'asc' : 'desc'; this._refresh(); };
    document.getElementById('gf-clear').onclick = () => { this.filters = { mes: '', categoria: '', cuenta: '' }; this.sort = { field: 'fecha', dir: 'desc' }; this.render(this.container); };
  },

  _refresh() {
    const list = document.getElementById('gastos-list');
    const count = document.getElementById('gastos-count');
    const sortBtn = document.getElementById('gf-sort-dir');
    if (list) list.innerHTML = this.renderList();
    if (sortBtn) sortBtn.textContent = this.sort.dir === 'desc' ? '↓' : '↑';
    if (count) {
      const total = this._filtered().length;
      const totalImporte = this._filtered().reduce((sum, g) => sum + store._n(g.importe), 0);
      count.textContent = total > 0 ? `${total} registro(s) — Total: ${formatCurrency(totalImporte, 'ARS')}` : '';
    }
  },

  _getMeses() {
    const meses = [...new Set(store.state.gastos.map(g => {
      if (!g.fecha) return null;
      const d = new Date(g.fecha);
      if (isNaN(d)) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean))].sort().reverse();
    return meses.map(m => {
      const [y, mo] = m.split('-');
      const label = new Date(`${y}-${mo}-01`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return { value: m, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
  },

  _filtered() {
    let gastos = [...store.state.gastos];
    if (this.filters.mes) {
      gastos = gastos.filter(g => {
        if (!g.fecha) return false;
        const d = new Date(g.fecha);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === this.filters.mes;
      });
    }
    if (this.filters.categoria) gastos = gastos.filter(g => g.categoria === this.filters.categoria);
    if (this.filters.cuenta) gastos = gastos.filter(g => g.cuentaorigen === this.filters.cuenta);

    // Sort
    gastos.sort((a, b) => {
      let va, vb;
      if (this.sort.field === 'fecha') { va = new Date(a.fecha || 0); vb = new Date(b.fecha || 0); }
      else if (this.sort.field === 'importe') { va = store._n(a.importe); vb = store._n(b.importe); }
      else { va = (a.categoria || '').toLowerCase(); vb = (b.categoria || '').toLowerCase(); }
      if (va < vb) return this.sort.dir === 'desc' ? 1 : -1;
      if (va > vb) return this.sort.dir === 'desc' ? -1 : 1;
      return 0;
    });
    return gastos;
  },

  renderList() {
    const gastos = this._filtered();
    if (gastos.length === 0) return '<p class="stat-label" style="text-align:center; padding:40px;">Sin gastos para los filtros seleccionados</p>';

    // Update count after render
    setTimeout(() => {
      const count = document.getElementById('gastos-count');
      if (count) {
        const totalImporte = gastos.reduce((sum, g) => sum + store._n(g.importe), 0);
        count.textContent = `${gastos.length} registro(s) — Total: ${formatCurrency(totalImporte, 'ARS')}`;
      }
    }, 0);

    return gastos.map(g => `
      <div class="item-card">
        <div class="item-info">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4>${g.categoria || 'Gasto'}${g.descripcion ? ' - ' + g.descripcion : ''}</h4>
            ${g.isPendingSync ? '<span title="Guardado localmente. Pendiente de sincronizar" style="font-size:0.8rem;">☁️</span>' : ''}
          </div>
          <p>${formatDate(g.fecha)} | ${g.cuentaorigen || 'S/C'} (${g.formapago || 'N/A'}) | ${g.esservicio === 'TRUE' ? '✅ Servicio' : '💸 Gasto'}</p>
        </div>
        <div class="item-value negative" style="font-weight:700;">
          -${formatCurrency(store._n(g.importe), 'ARS')}
        </div>
      </div>
    `).join('');
  },

  showAddModal() {
    const form = document.createElement('form');
    form.className = 'modal-form';

    // Build categories options - default option first
    const catOptions = store.state.categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

    form.innerHTML = `
      <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="g-fecha" class="form-input" value="${(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; })()}" required></div>
      <div class="form-group"><label class="form-label">Importe</label><input type="number" id="g-importe" class="form-input" step="0.01" required></div>
      <div class="form-group"><label class="form-label">Cuenta Origen</label><select id="g-cuenta" class="form-input" required>${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Forma de Pago</label><select id="g-formapago" class="form-input" required>${store.state.formasPago.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Categoría</label><select id="g-categoria" class="form-input" required>${catOptions}</select></div>
      <div class="form-group" style="display:flex; align-items:center; gap:10px; margin:15px 0;"><input type="checkbox" id="g-servicio"><label>¿Es Servicio?</label></div>
      <div id="g-serv-box" class="form-group" style="display:none;"><label class="form-label">Servicio</label><select id="g-servicio-val" class="form-input">${store.state.servicios.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="g-desc" class="form-input"></div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:15px;">Guardar Gasto</button>
    `;

    // Auto-set category "Servicio" when checkbox is toggled
    form.querySelector('#g-servicio').onchange = (e) => {
      const isChecked = e.target.checked;
      form.querySelector('#g-serv-box').style.display = isChecked ? 'block' : 'none';

      // Auto-select "Servicio" category when flag is set
      const catSelect = form.querySelector('#g-categoria');
      if (isChecked) {
        // Find "Servicio" option (case-insensitive)
        const servicioOpt = [...catSelect.options].find(o => o.value.toLowerCase() === 'servicio');
        if (servicioOpt) catSelect.value = servicioOpt.value;
      }
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const isS = form.querySelector('#g-servicio').checked;
      const data = {
        fecha: form.querySelector('#g-fecha').value,
        importe: form.querySelector('#g-importe').value,
        cuentaorigen: form.querySelector('#g-cuenta').value,
        formapago: form.querySelector('#g-formapago').value,
        categoria: form.querySelector('#g-categoria').value,
        esservicio: isS ? 'TRUE' : 'FALSE',
        descripcion: isS ? form.querySelector('#g-servicio-val').value : form.querySelector('#g-desc').value,
        // Parsear manualmente para evitar bug UTC: new Date('2026-06-06') = día anterior en AR (UTC-3)
        periodo: parseInt(form.querySelector('#g-fecha').value.split('-')[0], 10)
      };
      if (await store.addGasto(data)) { 
        Modal.hide(); 
        if (this.container) {
          this.render(this.container); 
        }
      }
    };
    Modal.show('Nuevo Gasto', form);
  }
};

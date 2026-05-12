import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const IngresosView = {
  title: 'Ingresos',
  // Filter & sort state
  filters: { mes: '', tipo: '', cuenta: '' },
  sort: { field: 'fecha', dir: 'desc' },

  render(container) {
    this.container = container;
    const meses = this._getMeses();
    const tipos = [...new Set([
      ...store.state.ingresos.map(i => i.tipoingreso),
      ...store.state.transferencias.map(() => 'Transferencia')
    ].filter(Boolean))].sort();
    const cuentas = [...new Set([
      ...store.state.ingresos.map(i => i.cuentadestino),
      ...store.state.transferencias.map(t => t.cuentaorigen),
      ...store.state.transferencias.map(t => t.cuentadestino)
    ].filter(Boolean))].sort();

    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>Ingresos / Transferencias</h2>
        <div style="display:flex; gap:10px;">
          <button id="add-trans-btn" class="btn btn-ghost">Transferencia</button>
          <button id="add-ingreso-btn" class="btn btn-primary">+ Nuevo Ingreso</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-bar" id="ingresos-filters">
        <select id="if-mes" class="filter-select" title="Mes">
          <option value="">📅 Todos los meses</option>
          ${meses.map(m => `<option value="${m.value}" ${this.filters.mes === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select>
        <select id="if-tipo" class="filter-select" title="Tipo">
          <option value="">🏷️ Todos los tipos</option>
          ${tipos.map(t => `<option value="${t}" ${this.filters.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <select id="if-cuenta" class="filter-select" title="Cuenta">
          <option value="">🏦 Todas las cuentas</option>
          ${cuentas.map(c => `<option value="${c}" ${this.filters.cuenta === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <div class="sort-controls">
          <select id="if-sort-field" class="filter-select sort-select" title="Ordenar por">
            <option value="fecha" ${this.sort.field === 'fecha' ? 'selected' : ''}>📆 Fecha</option>
            <option value="importe" ${this.sort.field === 'importe' ? 'selected' : ''}>💰 Importe</option>
          </select>
          <button id="if-sort-dir" class="btn-sort" title="Cambiar orden">
            ${this.sort.dir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <button id="if-clear" class="btn btn-ghost btn-sm" title="Limpiar filtros">✖ Limpiar</button>
      </div>

      <div id="ingresos-count" class="list-count"></div>
      <div class="list-container" id="ingresos-list">
        ${this.renderList()}
      </div>
    `;

    document.getElementById('add-ingreso-btn').onclick = () => this.showIngresoModal();
    document.getElementById('add-trans-btn').onclick = () => this.showTransModal();

    // Filter events
    document.getElementById('if-mes').onchange = (e) => { this.filters.mes = e.target.value; this._refresh(); };
    document.getElementById('if-tipo').onchange = (e) => { this.filters.tipo = e.target.value; this._refresh(); };
    document.getElementById('if-cuenta').onchange = (e) => { this.filters.cuenta = e.target.value; this._refresh(); };
    document.getElementById('if-sort-field').onchange = (e) => { this.sort.field = e.target.value; this._refresh(); };
    document.getElementById('if-sort-dir').onclick = () => { this.sort.dir = this.sort.dir === 'desc' ? 'asc' : 'desc'; this._refresh(); };
    document.getElementById('if-clear').onclick = () => { this.filters = { mes: '', tipo: '', cuenta: '' }; this.sort = { field: 'fecha', dir: 'desc' }; this.render(this.container); };
  },

  _refresh() {
    const list = document.getElementById('ingresos-list');
    const count = document.getElementById('ingresos-count');
    const sortBtn = document.getElementById('if-sort-dir');
    if (list) list.innerHTML = this.renderList();
    if (sortBtn) sortBtn.textContent = this.sort.dir === 'desc' ? '↓' : '↑';
    if (count) {
      const items = this._filtered();
      const totalIngresos = items.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + store._n(m.importe), 0);
      count.textContent = items.length > 0 ? `${items.length} registro(s) — Ingresos: ${formatCurrency(totalIngresos, 'ARS')}` : '';
    }
  },

  _getMeses() {
    const all = [
      ...store.state.ingresos.map(i => i.fecha),
      ...store.state.transferencias.map(t => t.fecha)
    ].filter(Boolean);
    const meses = [...new Set(all.map(f => {
      const d = new Date(f);
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
    let list = [
      ...store.state.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ...store.state.transferencias.map(t => ({ ...t, tipo: 'trans' }))
    ];

    if (this.filters.mes) {
      list = list.filter(m => {
        if (!m.fecha) return false;
        const d = new Date(m.fecha);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === this.filters.mes;
      });
    }
    if (this.filters.tipo) {
      list = list.filter(m => {
        if (this.filters.tipo === 'Transferencia') return m.tipo === 'trans';
        return m.tipo === 'ingreso' && m.tipoingreso === this.filters.tipo;
      });
    }
    if (this.filters.cuenta) {
      list = list.filter(m =>
        m.cuentadestino === this.filters.cuenta ||
        m.cuentaorigen === this.filters.cuenta
      );
    }

    // Sort
    list.sort((a, b) => {
      let va, vb;
      if (this.sort.field === 'importe') { va = store._n(a.importe); vb = store._n(b.importe); }
      else { va = new Date(a.fecha || 0); vb = new Date(b.fecha || 0); }
      if (va < vb) return this.sort.dir === 'desc' ? 1 : -1;
      if (va > vb) return this.sort.dir === 'desc' ? -1 : 1;
      return 0;
    });

    return list;
  },

  renderList() {
    const list = this._filtered();
    if (list.length === 0) return '<p class="stat-label" style="text-align:center; padding:40px;">Sin movimientos para los filtros seleccionados</p>';

    // Update count after render
    setTimeout(() => {
      const count = document.getElementById('ingresos-count');
      if (count) {
        const totalIngresos = list.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + store._n(m.importe), 0);
        count.textContent = `${list.length} registro(s) — Ingresos: ${formatCurrency(totalIngresos, 'ARS')}`;
      }
    }, 0);

    return list.map(m => `
      <div class="item-card">
        <div class="item-info">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4>${m.tipo === 'ingreso' ? (m.tipoingreso || 'Ingreso') : 'Transferencia'}</h4>
            ${m.isPendingSync ? '<span title="Guardado localmente. Pendiente de sincronizar" style="font-size:0.8rem;">☁️</span>' : ''}
          </div>
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

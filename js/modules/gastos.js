import { store } from '../store.js';
import { Modal } from '../components.js';
import { formatCurrency, formatDate } from '../utils.js';

export const GastosView = {
  title: 'Gastos',
  render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h2>Gastos</h2>
        <button id="add-gasto-btn" class="btn btn-primary">+ Nuevo Gasto</button>
      </div>
      <div class="list-container">
        ${this.renderList()}
      </div>
    `;
    document.getElementById('add-gasto-btn').onclick = () => this.showAddModal();
  },

  renderList() {
    const gastos = store.state.gastos;
    if (gastos.length === 0) return '<p class="stat-label" style="text-align:center; padding:40px;">Sin gastos</p>';
    const sorted = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return sorted.map(g => `
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
    form.innerHTML = `
      <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="g-fecha" class="form-input" value="${new Date().toISOString().split('T')[0]}" required></div>
      <div class="form-group"><label class="form-label">Importe</label><input type="number" id="g-importe" class="form-input" step="0.01" required></div>
      <div class="form-group"><label class="form-label">Cuenta Origen</label><select id="g-cuenta" class="form-input" required>${store.state.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Forma de Pago</label><select id="g-formapago" class="form-input" required>${store.state.formasPago.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Categoría</label><select id="g-categoria" class="form-input" required>${store.state.categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}</select></div>
      <div class="form-group" style="display:flex; align-items:center; gap:10px; margin:15px 0;"><input type="checkbox" id="g-servicio"><label>¿Es Servicio?</label></div>
      <div id="g-serv-box" class="form-group" style="display:none;"><label class="form-label">Servicio</label><select id="g-servicio-val" class="form-input">${store.state.servicios.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="g-desc" class="form-input"></div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:15px;">Guardar Gasto</button>
    `;

    form.querySelector('#g-servicio').onchange = (e) => form.querySelector('#g-serv-box').style.display = e.target.checked ? 'block' : 'none';
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
        periodo: new Date(form.querySelector('#g-fecha').value).getFullYear()
      };
      if (await store.addGasto(data)) { Modal.hide(); this.render(this.container); }
    };
    Modal.show('Nuevo Gasto', form);
  }
};

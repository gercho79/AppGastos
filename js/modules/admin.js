import { store } from '../store.js';
import { Modal } from '../components.js';
import { api } from '../api.js';

export const AdminView = {
  title: 'Administración',
  render(container) {
    container.innerHTML = `
      <div class="admin-sections">
        
        <div class="stat-card" style="margin-bottom: 24px;">
          <h3>Apertura de Período</h3>
          <p class="stat-label">Define el año de ejercicio actual y futuros.</p>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.periodos.map(p => `
              <div class="item-card" style="padding: 10px 16px;">
                <span>Ejercicio ${p.año}</span>
                <span class="badge" style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${p.estado}</span>
              </div>
            `).join('')}
          </div>
          <button id="add-periodo-btn" class="btn btn-ghost btn-sm">Abrir Ejercicio 2026</button>
        </div>

        <div class="stat-card" style="margin-bottom: 24px;">
          <h3>Tipos de Ingreso</h3>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.tiposIngreso.map(t => `<div class="item-card" style="padding: 10px 16px;">${t.nombre}</div>`).join('')}
          </div>
        </div>

        <div class="stat-card">
          <h3>Formas de Pago</h3>
          <div class="list-container" style="margin: 16px 0;">
            ${store.state.formasPago.map(f => `<div class="item-card" style="padding: 10px 16px;">${f.nombre}</div>`).join('')}
          </div>
        </div>

      </div>
    `;

    document.getElementById('add-periodo-btn').addEventListener('click', async () => {
      await api.post('addPeriodo', { año: 2026, estado: 'Abierto' });
      await store.refreshAll();
      this.render(container);
    });
  }
};

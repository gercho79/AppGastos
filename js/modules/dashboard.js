import { store } from '../store.js';
import { formatCurrency, getMonthName } from '../utils.js';

export const DashboardView = {
  title: 'Dashboard',
  render(container) {
    const balances = store.getBalances();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const gastosByCategory = store.getGastosByCategory();

    container.innerHTML = `
      <div class="dashboard-header">
        <div class="date-display">${getMonthName(currentMonth)} ${currentYear}</div>
      </div>

      <!-- Resumen General -->
      <div class="dashboard-grid" style="margin-bottom: 32px;">
        <div class="stat-card main-balance">
          <div class="stat-label">Total Disponible (ARS)</div>
          <div class="stat-value" id="total-ars">...</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ahorros (USD)</div>
          <div class="stat-value" id="total-usd">...</div>
        </div>
      </div>

      <!-- Detalle por Cuenta -->
      <h3 style="margin-bottom: 16px;">Mis Cuentas</h3>
      <div class="dashboard-grid" style="margin-bottom: 32px;">
        ${Object.values(balances).map(data => `
          <div class="stat-card" style="padding: 20px;">
            <div class="flex-between" style="margin-bottom: 16px;">
              <div>
                <div class="stat-label" style="margin-bottom: 2px;">${data.displayName}</div>
                <div class="stat-value ${data.saldo < 0 ? 'negative' : ''}" style="font-size: 1.5rem;">
                  ${formatCurrency(data.saldo, data.moneda)}
                </div>
              </div>
              <span style="font-size: 0.7rem; padding: 3px 8px; border-radius: 20px; background: var(--glass); color: var(--text-secondary);">${data.moneda}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px; border-top: 1px solid var(--glass-border);">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Ingresos</div>
                <div style="font-weight: 700; color: var(--success); font-size: 0.95rem;">
                  +${formatCurrency(data.totalIngresos, data.moneda)}
                </div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Gastos</div>
                <div style="font-weight: 700; color: var(--danger); font-size: 0.95rem;">
                  -${formatCurrency(data.totalGastos, data.moneda)}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Gastos por Categoría -->
      <h3 style="margin-bottom: 16px;">Gastos por Categoría</h3>
      <div class="stat-card">
        <canvas id="category-chart" style="max-height: 300px;"></canvas>
      </div>
    `;

    this.updateTotals(balances);
    this.renderChart(gastosByCategory);
  },

  updateTotals(balances) {
    let totalArs = 0;
    let totalUsd = 0;
    Object.values(balances).forEach(b => {
      if (b.moneda === 'ARS') totalArs += b.saldo;
      if (b.moneda === 'USD') totalUsd += b.saldo;
    });

    document.getElementById('total-ars').textContent = formatCurrency(totalArs, 'ARS');
    document.getElementById('total-usd').textContent = formatCurrency(totalUsd, 'USD');
  },

  renderChart(data) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (labels.length === 0) {
      ctx.font = '14px Inter';
      ctx.fillStyle = '#a0a0b8';
      ctx.textAlign = 'center';
      ctx.fillText('Sin gastos en este período', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#6c63ff', '#4ecdc4', '#ffb142', '#ff5252', '#00d2ff', '#9c27b0', '#ff9800', '#e91e63'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#a0a0b8', font: { family: 'Inter' } }
          }
        }
      }
    });
  }
};

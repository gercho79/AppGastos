import { store } from '../store.js';
import { formatCurrency, getMonthName } from '../utils.js';

// Parsea "YYYY-MM-DD" sin pasar por UTC (evita bug de zona horaria Argentina)
function parseDateLocal(dateString) {
  if (!dateString) return null;
  const parts = String(dateString).split('T')[0].split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return { year: parts[0], month: parts[1] - 1 }; // month 0-indexed
  }
  return null;
}

export const DashboardView = {
  title: 'Dashboard',

  // Estado de los selectores de mes
  selectedMonthChart: null,  // { year, month } o null = mes actual
  selectedMonthResumen: null, // { year, month } o null = mes actual

  render(container) {
    this.container = container;
    const balances = store.getBalances();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Inicializar al mes actual si no hay selección
    if (!this.selectedMonthChart)   this.selectedMonthChart   = { year: currentYear, month: currentMonth };
    if (!this.selectedMonthResumen) this.selectedMonthResumen = { year: currentYear, month: currentMonth };

    const monthOptions = this._getAvailableMonths();

    container.innerHTML = `
      <div class="dashboard-header">
        <div class="date-display">${getMonthName(currentMonth)} ${currentYear}</div>
      </div>

      <!-- Resumen General de Cuentas -->
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

      <!-- Resumen Mensual Gastos / Ingresos -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <h3 style="margin: 0;">Resumen Mensual</h3>
        <select id="resumen-mes-select" class="filter-select" style="min-width: 180px;">
          ${monthOptions.map(m => `
            <option value="${m.value}" ${m.value === this._monthKey(this.selectedMonthResumen) ? 'selected' : ''}>
              ${m.label}
            </option>
          `).join('')}
        </select>
      </div>
      <div id="resumen-mensual-cards" style="margin-bottom: 32px;">
        ${this._renderResumenCards(this.selectedMonthResumen)}
      </div>

      <!-- Gastos por Categoría -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <h3 style="margin: 0;">Gastos por Categoría</h3>
        <select id="chart-mes-select" class="filter-select" style="min-width: 180px;">
          ${monthOptions.map(m => `
            <option value="${m.value}" ${m.value === this._monthKey(this.selectedMonthChart) ? 'selected' : ''}>
              ${m.label}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="stat-card">
        <canvas id="category-chart" style="max-height: 300px;"></canvas>
      </div>
    `;

    this.updateTotals(balances);
    this._renderChart();

    // Evento: cambio de mes en el gráfico
    document.getElementById('chart-mes-select').onchange = (e) => {
      this.selectedMonthChart = this._parseMonthKey(e.target.value);
      this._renderChart();
    };

    // Evento: cambio de mes en resumen
    document.getElementById('resumen-mes-select').onchange = (e) => {
      this.selectedMonthResumen = this._parseMonthKey(e.target.value);
      document.getElementById('resumen-mensual-cards').innerHTML =
        this._renderResumenCards(this.selectedMonthResumen);
    };
  },

  // Genera clave "YYYY-MM" a partir de {year, month}
  _monthKey({ year, month }) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  },

  // Parsea "YYYY-MM" a {year, month}
  _parseMonthKey(key) {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m - 1 };
  },

  // Obtiene todos los meses que tienen gastos o ingresos (sin duplicados)
  _getAvailableMonths() {
    const monthSet = new Set();
    const now = new Date();
    // Siempre incluir el mes actual
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    [...store.state.gastos, ...store.state.ingresos].forEach(item => {
      const p = parseDateLocal(item.fecha);
      if (p) monthSet.add(`${p.year}-${String(p.month + 1).padStart(2, '0')}`);
    });

    return [...monthSet].sort().reverse().map(key => {
      const [y, m] = key.split('-').map(Number);
      const label = `${getMonthName(m - 1)} ${y}`;
      return { value: key, label };
    });
  },

  // Filtra gastos por mes
  _gastosMes({ year, month }) {
    return store.state.gastos.filter(g => {
      const p = parseDateLocal(g.fecha);
      return p && p.year === year && p.month === month;
    });
  },

  // Filtra ingresos por mes
  _ingresosMes({ year, month }) {
    return store.state.ingresos.filter(i => {
      const p = parseDateLocal(i.fecha);
      return p && p.year === year && p.month === month;
    });
  },

  // Renderiza las cards de resumen mensual
  _renderResumenCards(selectedMonth) {
    const gastosMes    = this._gastosMes(selectedMonth);
    const ingresosMes  = this._ingresosMes(selectedMonth);
    const totalGastos  = gastosMes.reduce((s, g) => s + store._n(g.importe), 0);
    const totalIngresos = ingresosMes.reduce((s, i) => s + store._n(i.importe), 0);
    const balance      = totalIngresos - totalGastos;
    const label        = `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`;

    return `
      <div class="dashboard-grid">
        <div class="stat-card" style="padding: 20px; border-left: 3px solid var(--success);">
          <div class="stat-label" style="margin-bottom: 6px;">💰 Ingresos — ${label}</div>
          <div class="stat-value" style="color: var(--success); font-size: 1.6rem;">
            ${formatCurrency(totalIngresos, 'ARS')}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">
            ${ingresosMes.length} movimiento(s)
          </div>
        </div>
        <div class="stat-card" style="padding: 20px; border-left: 3px solid var(--danger);">
          <div class="stat-label" style="margin-bottom: 6px;">💸 Gastos — ${label}</div>
          <div class="stat-value" style="color: var(--danger); font-size: 1.6rem;">
            ${formatCurrency(totalGastos, 'ARS')}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">
            ${gastosMes.length} movimiento(s)
          </div>
        </div>
        <div class="stat-card" style="padding: 20px; border-left: 3px solid ${balance >= 0 ? 'var(--success)' : 'var(--danger)'};">
          <div class="stat-label" style="margin-bottom: 6px;">📊 Balance — ${label}</div>
          <div class="stat-value ${balance < 0 ? 'negative' : ''}" style="font-size: 1.6rem;">
            ${formatCurrency(balance, 'ARS')}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">
            ${balance >= 0 ? '✅ Saldo positivo' : '⚠️ Saldo negativo'}
          </div>
        </div>
      </div>
    `;
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

  _renderChart() {
    // Destruir chart anterior si existe
    if (this._chartInstance) {
      this._chartInstance.destroy();
      this._chartInstance = null;
    }

    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Gastos del mes seleccionado
    const gastosMes = this._gastosMes(this.selectedMonthChart);
    const data = {};
    gastosMes.forEach(g => {
      const cat = g.categoria || 'Sin Categoría';
      data[cat] = (data[cat] || 0) + store._n(g.importe);
    });

    const labels = Object.keys(data);
    const values = Object.values(data);
    const label  = `${getMonthName(this.selectedMonthChart.month)} ${this.selectedMonthChart.year}`;

    if (labels.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.height = 80;
      ctx.font = '14px Inter';
      ctx.fillStyle = '#a0a0b8';
      ctx.textAlign = 'center';
      ctx.fillText(`Sin gastos en ${label}`, canvas.width / 2, 45);
      return;
    }

    canvas.height = 300;
    this._chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#6c63ff', '#4ecdc4', '#ffb142', '#ff5252',
            '#00d2ff', '#9c27b0', '#ff9800', '#e91e63',
            '#00c853', '#2196f3', '#ff6f00', '#607d8b'
          ],
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
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${formatCurrency(val, 'ARS')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
};

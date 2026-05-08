import { store } from './store.js';
import { AppRouter } from './router.js';
import { DashboardView } from './modules/dashboard.js';
import { GastosView } from './modules/gastos.js';
import { IngresosView } from './modules/ingresos.js';
import { CuentasView } from './modules/cuentas.js';
import { AdminView } from './modules/admin.js';
import { auth } from './auth.js';
import { Modal } from './components.js';
import { HeaderWidget } from './header-widget.js';

const routes = {
  'dashboard': DashboardView,
  'gastos': GastosView,
  'ingresos': IngresosView,
  'cuentas': CuentasView,
  'admin': AdminView
};

class App {
  constructor() {
    this.router = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    HeaderWidget.init();

    // Initialize Auth and Google Library
    auth.init((isAuthenticated) => {
      this.updateAuthUI(isAuthenticated);
      if (isAuthenticated) {
        store.refreshAll();
      }
    });

    this.router = new AppRouter(routes);
    
    // Refresh data periodically if authenticated
    setInterval(() => {
      if (auth.isAuthenticated()) {
        store.refreshAll();
      }
    }, 5 * 60 * 1000);

    // Auto-refresh current view when store changes
    store.subscribe(() => {
      if (this.router) this.router.resolve();
    });
  }

  updateAuthUI(isAuthenticated) {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (isAuthenticated) {
      container.innerHTML = `
        <div style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          <div class="status-indicator sync-ok" style="display: inline-block; margin-right: 6px;"></div>
          Conectado
        </div>
        <button id="logout-btn" class="btn btn-ghost btn-sm btn-full">Cerrar Sesión</button>
      `;
      document.getElementById('logout-btn').onclick = () => auth.logout();
    } else {
      container.innerHTML = `
        <button id="login-btn" class="btn btn-primary btn-sm btn-full">
          Conectar Google Sheets
        </button>
      `;
      document.getElementById('login-btn').onclick = () => auth.login();
    }
  }

  setupEventListeners() {
    // Mobile Menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar.classList.add('mobile-active');
      overlay.classList.remove('hidden');
    });

    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar.classList.remove('mobile-active');
      overlay.classList.add('hidden');
    });

    // Desktop Sidebar Collapse
    const sidebar = document.getElementById('sidebar');
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      sidebar.classList.add('collapsed');
    }
    document.getElementById('sidebar-collapse-btn').addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });

    // Toggle Amounts Visibility
    const app = document.getElementById('app');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    if (localStorage.getItem('amounts-hidden') === 'true') {
      app.classList.add('amounts-hidden');
      eyeOpen.style.display = 'none';
      eyeClosed.style.display = 'block';
    }
    document.getElementById('toggle-amounts-btn').addEventListener('click', () => {
      const hidden = app.classList.toggle('amounts-hidden');
      eyeOpen.style.display = hidden ? 'none' : 'block';
      eyeClosed.style.display = hidden ? 'block' : 'none';
      localStorage.setItem('amounts-hidden', hidden);
    });

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', () => Modal.hide());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') Modal.hide();
    });
  }
}

// Global App Instance
window.app = new App();

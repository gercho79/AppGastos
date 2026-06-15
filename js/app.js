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
import { showToast } from './utils.js';

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

    // Set up router FIRST
    this.router = new AppRouter(routes);

    // Subscribe to store changes BEFORE auth init to avoid race conditions on mobile
    store.subscribe((state) => {
      if (this.router) this.router.resolve();
      this.updateSyncUI(state);
    });

    // Initialize Auth and Google Library
    auth.init((isAuthenticated) => {
      this.updateAuthUI(isAuthenticated);
      if (isAuthenticated) {
        store.processSyncQueue().then(() => store.refreshAll());
      }
    });
    
    // Refresh data periodically if authenticated
    setInterval(() => {
      if (auth.isAuthenticated()) {
        store.refreshAll();
      }
    }, 5 * 60 * 1000);
  }

  updateAuthUI(isAuthenticated) {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (isAuthenticated) {
      container.innerHTML = `
        <div style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          <div id="sidebar-sync-indicator" class="status-indicator sync-ok" style="display: inline-block; margin-right: 6px;"></div>
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

  updateSyncUI(state) {
    const headerDot = document.querySelector('.sync-dot');
    const sidebarDot = document.getElementById('sidebar-sync-indicator');
    
    let statusClass = 'sync-ok';
    let title = 'Sincronizado';

    if (!state.isOnline) {
      statusClass = 'sync-error'; // Orange/Red
      title = `Offline - ${state.syncQueueLength} pendientes`;
    } else if (state.isSyncing || state.isLoading) {
      statusClass = 'sync-syncing'; // Blue
      title = 'Sincronizando...';
    } else if (state.syncQueueLength > 0) {
      statusClass = 'sync-warning'; // Yellow
      title = `${state.syncQueueLength} pendientes de sincronizar`;
    }

    if (headerDot) {
      headerDot.className = `sync-dot ${statusClass}`;
      headerDot.parentElement.title = title;
    }
    if (sidebarDot) {
      sidebarDot.className = `status-indicator ${statusClass}`;
      sidebarDot.parentElement.title = title;
    }
  }

  setupEventListeners() {
    // Network listeners
    window.addEventListener('online', () => {
      store.setOnlineStatus(true);
    });
    window.addEventListener('offline', () => {
      store.setOnlineStatus(false);
    });

    // Refresh Button
    document.getElementById('refresh-btn').addEventListener('click', async () => {
      if (!auth.isAuthenticated()) {
        showToast('Debés conectar Google Sheets primero', 'error');
        return;
      }
      const icon = document.getElementById('refresh-icon');
      icon.style.animation = 'spin 0.8s linear infinite';
      await store.refreshAll();
      icon.style.animation = '';
      showToast('Datos actualizados desde Google Sheets ✓');
      // Re-render current view
      if (this.router) this.router.resolve();
    });
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

    // Global FAB Gasto
    const fabGasto = document.getElementById('global-fab-gasto');
    if (fabGasto) {
      fabGasto.addEventListener('click', () => {
        GastosView.showAddModal();
      });
    }
  }
}

// Global App Instance
window.app = new App();

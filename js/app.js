import { store } from './store.js';
import { AppRouter } from './router.js';
import { DashboardView } from './modules/dashboard.js';
import { GastosView } from './modules/gastos.js';
import { IngresosView } from './modules/ingresos.js';
import { CuentasView } from './modules/cuentas.js';
import { AdminView } from './modules/admin.js';
import { api } from './api.js';
import { Modal } from './components.js';

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

    // Check if API is configured
    if (!api.apiUrl && !localStorage.getItem('appgastos_demo_mode')) {
      this.showConfigScreen();
    } else {
      await this.startApp();
    }
  }

  showConfigScreen() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('config-screen').classList.remove('hidden');
  }

  async startApp() {
    document.getElementById('config-screen').classList.add('hidden');
    document.getElementById('splash').classList.remove('hidden');

    try {
      await store.init();
      this.router = new AppRouter(routes);

      // Auto-refresh current view when store changes
      store.subscribe(() => {
        if (this.router) this.router.resolve();
      });

      document.getElementById('splash').classList.add('hidden');
      document.getElementById('main-layout').classList.remove('hidden');
    } catch (error) {
      console.error('App start error:', error);
      this.showConfigScreen();
    }
  }

  setupEventListeners() {
    // Config Screen
    /*document.getElementById('cfg-save-btn').addEventListener('click', async () => {
      const url = document.getElementById('cfg-api-url').value;
      if (url) {
        api.setApiUrl(url);
        await this.startApp();
      }
    });*/

    /*document.getElementById('cfg-demo-btn').addEventListener('click', async () => {
      localStorage.setItem('appgastos_demo_mode', 'true');
      await this.startApp();
    });*/

    /*document.getElementById('config-help-link').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('config-help').classList.toggle('hidden');
    });*/

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

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', () => Modal.hide());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') Modal.hide();
    });

    // Sidebar Config Button
    /*document.getElementById('sidebar-config-btn').addEventListener('click', () => {
      this.showConfigScreen();
    });*/
  }
}

// Global App Instance
window.app = new App();

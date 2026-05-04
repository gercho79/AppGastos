export class AppRouter {
  constructor(routes) {
    this.routes = routes;
    this.contentElement = document.getElementById('page-content');
    this.titleElement = document.getElementById('page-title');
    
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }

  resolve() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = this.routes[hash] || this.routes['dashboard'];
    
    // Update active states in nav
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === hash);
    });

    if (this.titleElement) {
      this.titleElement.textContent = route.title;
    }

    if (route.render) {
      this.contentElement.innerHTML = '';
      route.render(this.contentElement);
    }
    
    // Close mobile menu/sidebar if open
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
    document.getElementById('sidebar')?.classList.remove('mobile-active');
  }

  navigate(hash) {
    window.location.hash = hash;
  }
}

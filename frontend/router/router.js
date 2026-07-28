/**
 * Senthil Enterprises ERP - SPA Router
 * Handles hash-based routing, route guards, and lazy loading.
 * Includes active sidebar link update and page cleanup on navigation.
 */
import { routes, defaultRoute, errorRoute, loginRoute } from '../config/routes.js';

export class Router {
  constructor(rootElementId) {
    this.rootElement = document.getElementById(rootElementId);
    this.currentRoute = null;
    // Track cleanup functions registered by pages
    this._pageCleanup = null;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
  }

  getCurrentPath() {
    const hash = window.location.hash.slice(1);
    return hash || defaultRoute;
  }

  async handleRouteChange() {
    const path = this.getCurrentPath();
    let route = routes.find(r => r.path === path);

    // 404 Fallback
    if (!route) {
      route = routes.find(r => r.path === errorRoute);
      window.history.replaceState(null, null, '#' + errorRoute);
    }

    // Route Guard Strategy (Placeholder)
    if (route.authRequired) {
      const isAuthenticated = true; // Placeholder: await authService.isAuthenticated()
      if (!isAuthenticated) {
        this.navigate(loginRoute);
        return;
      }
    }

    this.currentRoute = route;

    // Update active sidebar link
    this._updateSidebarActive(path);

    // Update navbar title
    this._updateNavbarTitle(route.name || 'Dashboard');

    await this.renderPage(route);
  }

  _updateSidebarActive(path) {
    const sidebarLinks = document.querySelectorAll('#sidebar-root .sidebar-link');
    sidebarLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      // href is like "#/pos", path is like "/pos" — normalize both
      const linkPath = href.replace(/^#/, '') || '/';
      const currentPath = path || '/';
      const isActive = linkPath === currentPath;
      link.classList.toggle('active', isActive);
      link.classList.toggle('text-primary', isActive);
      link.classList.toggle('bg-primary/10', isActive);
      link.classList.toggle('text-gray-500', !isActive);
      link.classList.toggle('hover:text-text', !isActive);
      // Icon inside the link
      const icon = link.querySelector('div');
      if (icon) {
        icon.classList.toggle('text-primary', isActive);
        icon.classList.toggle('text-gray-400', !isActive);
      }
    });
  }

  _updateNavbarTitle(title) {
    const navTitle = document.querySelector('#navbar-root h2');
    if (navTitle) navTitle.textContent = title;
  }

  async renderPage(route) {
    try {
      // Run page cleanup before leaving current page
      if (this._pageCleanup && typeof this._pageCleanup === 'function') {
        this._pageCleanup();
        this._pageCleanup = null;
      }

      // Lazy load the page module
      const module = await import(route.componentPath);
      
      // Clear root
      this.rootElement.innerHTML = '';
      
      if (typeof module.render === 'function') {
        const content = await module.render();
        this.rootElement.innerHTML = content;
      } else {
        throw new Error(`Page module for ${route.path} does not export a render() function.`);
      }

      // Call onMount and capture cleanup if returned
      if (typeof module.onMount === 'function') {
        const cleanup = module.onMount(this.rootElement);
        if (typeof cleanup === 'function') {
          this._pageCleanup = cleanup;
        }
      }

      // Globally ensure all icons render
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      // Scroll to top on navigation
      window.scrollTo(0, 0);

    } catch (error) {
      console.error(`Router Error rendering page ${route.path}:`, error);
      this.rootElement.innerHTML = `
        <div class="p-10 text-center">
          <div class="text-danger text-4xl font-bold mb-4">⚠</div>
          <h2 class="text-xl font-semibold text-text mb-2">Failed to load page</h2>
          <p class="text-sm text-gray-500 mb-4">${error.message}</p>
          <a href="#/" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm">Return to Dashboard</a>
        </div>
      `;
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}

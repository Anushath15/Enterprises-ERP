/**
 * Senthil Enterprises ERP - SPA Router
 * Handles hash-based routing, route guards, and lazy loading.
 * Includes active sidebar link update and page cleanup on navigation.
 */
import { routes, defaultRoute, errorRoute, loginRoute } from '../config/routes.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { AuthService } from '../services/authService.js';

export class Router {
  constructor(rootElementId) {
    this.rootElement = document.getElementById(rootElementId);
    this.currentRoute = null;
    // Track cleanup functions registered by pages
    this._pageCleanup = null;
    // Monotonic token so a slow/stale async render cannot clobber a newer one
    this._renderSeq = 0;
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

    // Route Guard: enforce authentication and role-based access
    if (route.authRequired) {
      if (!AuthService.hasValidSession()) {
        AuthService.clearSession();
        AuthService.redirectToLogin();
        return;
      }
      if (route.roles && route.roles.length > 0 && !AuthService.hasRole(route.roles)) {
        this.navigate('/403');
        return;
      }
    } else if (path === loginRoute && AuthService.hasValidSession()) {
      // Already authenticated: skip the login screen
      this.navigate(defaultRoute);
      return;
    }

    this.currentRoute = route;

    // Update active sidebar link
    this._updateSidebarActive(path);

    // Update navbar title
    this._updateNavbarTitle(route.name || 'Dashboard');

    await this.renderPage(route);
  }

  _updateSidebarActive(path) {
    const currentRoute = window.location.hash || '#/dashboard';
    document.querySelectorAll('.sidebar-link').forEach(link => {
      const route = link.getAttribute('data-route') || link.getAttribute('href');
      if (!route) return;
      
      const isActive = route === currentRoute;
      
      // Toggle parent link classes
      link.classList.toggle('active', isActive);
      link.classList.toggle('text-primary', isActive);
      link.classList.toggle('bg-blue-50', isActive);
      link.classList.toggle('text-gray-500', !isActive);
      link.classList.toggle('hover:text-text', !isActive);
      link.classList.toggle('hover:bg-gray-50', !isActive);
      
      // Toggle icon classes
      const icon = link.querySelector('div');
      if (icon) {
        icon.classList.toggle('text-primary', isActive);
        icon.classList.toggle('text-gray-400', !isActive);
      }
    });
  }

  _updateNavbarTitle(title) {
    const navTitle = document.getElementById('navbar-title');
    if (navTitle) navTitle.textContent = title;
  }

  async renderPage(route) {
    const seq = ++this._renderSeq;

    try {
      // Run page cleanup before leaving current page
      if (this._pageCleanup && typeof this._pageCleanup === 'function') {
        const cleanup = this._pageCleanup;
        this._pageCleanup = null;
        cleanup();
      }

      // Lazy load the page module
      const module = await import(route.componentPath);
      if (seq !== this._renderSeq) return;

      // Clear root
      this.rootElement.innerHTML = '';

      if (typeof module.render === 'function') {
        const content = await module.render();
        if (seq !== this._renderSeq) return;
        this.rootElement.innerHTML = content;
      } else {
        throw new Error(`Page module for ${route.path} does not export a render() function.`);
      }

      // Call onMount and capture cleanup if returned
      if (typeof module.onMount === 'function') {
        const cleanup = await module.onMount(this.rootElement);
        if (seq !== this._renderSeq) {
          // Stale render finished mounting a page we have already left
          if (typeof cleanup === 'function') cleanup();
          return;
        }
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
      if (seq !== this._renderSeq) return;
      console.error(`Router Error rendering page ${route.path}:`, error);
      this.rootElement.innerHTML = `
        <div class="p-10 text-center">
          <div class="text-danger text-4xl font-bold mb-4">⚠</div>
          <h2 class="text-xl font-semibold text-text mb-2">Failed to load page</h2>
          <p class="text-sm text-gray-500 mb-4">${escapeHtml(error && error.message)}</p>
          <a href="#/" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm">Return to Dashboard</a>
        </div>
      `;
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}

/**
 * Senthil Enterprises ERP - SPA Router
 * Handles hash-based or history-based routing, route guards, and lazy loading.
 */
import { routes, defaultRoute, errorRoute, loginRoute } from '../config/routes.js';
// import { authService } from '../services/auth/authService.js'; // Placeholder for Phase 7

export class Router {
  constructor(rootElementId) {
    this.rootElement = document.getElementById(rootElementId);
    this.currentRoute = null;
    this.init();
  }

  init() {
    // Listen for history changes (hash routing for simplicity in offline-first, but extensible to History API)
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
      const isAuthenticated = true; // Placeholder: await authService.isAuthenticated();
      if (!isAuthenticated) {
        console.warn(`Router Guard: Blocked access to ${path}`);
        this.navigate(loginRoute);
        return;
      }
    }

    this.currentRoute = route;
    await this.renderPage(route);
  }

  async renderPage(route) {
    try {
      // Lazy loading strategy: dynamically import the page controller
      const module = await import(route.componentPath);
      
      // Clear root
      this.rootElement.innerHTML = '';
      
      // Pages are expected to export a 'render' function that returns HTML or mounts it
      if (typeof module.render === 'function') {
        const content = await module.render();
        this.rootElement.innerHTML = content;
      } else {
        throw new Error(`Page module for ${route.path} does not export a render() function.`);
      }

      // Pages can also export an 'onMount' function for event delegation
      if (typeof module.onMount === 'function') {
        module.onMount(this.rootElement);
      }

    } catch (error) {
      console.error(`Router Error rendering page ${route.path}:`, error);
      this.rootElement.innerHTML = `<div class="p-10 text-danger text-center">Failed to load module for route: ${route.path}</div>`;
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}

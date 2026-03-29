// ============================================
// STD TIME TRACKER — SPA Router
// ============================================

import { events, EVENTS } from './events.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentPage = null;
    this.container = null;
    this.beforeEach = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }

  register(path, pageFactory) {
    this.routes[path] = pageFactory;
  }

  guard(callback) {
    this.beforeEach = callback;
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    
    // Run guard
    if (this.beforeEach) {
      const redirect = this.beforeEach(hash);
      if (redirect && redirect !== hash) {
        this.navigate(redirect);
        return;
      }
    }

    const pageFactory = this.routes[hash];
    if (!pageFactory) {
      // Try to find a fallback
      if (this.routes['/dashboard']) {
        this.navigate('/dashboard');
      }
      return;
    }

    // Animate out current page
    if (this.container) {
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        // Destroy current page
        if (this.currentPage && typeof this.currentPage.destroy === 'function') {
          this.currentPage.destroy();
        }

        // Create new page
        const page = pageFactory();
        this.currentPage = page;
        this.currentRoute = hash;

        // Render
        if (this.container) {
          this.container.innerHTML = '';
          if (typeof page.render === 'function') {
            const content = page.render();
            if (typeof content === 'string') {
              this.container.innerHTML = content;
            } else if (content instanceof HTMLElement) {
              this.container.appendChild(content);
            }
          }

          // Mount
          if (typeof page.mount === 'function') {
            page.mount();
          }

          // Animate in
          requestAnimationFrame(() => {
            this.container.style.transition = 'opacity 300ms ease, transform 300ms ease';
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateY(0)';
          });
        }

        events.emit(EVENTS.ROUTE_CHANGED, { path: hash });
      }, 150);
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();

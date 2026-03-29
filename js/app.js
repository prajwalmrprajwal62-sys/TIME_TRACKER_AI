// ============================================
// STD TIME TRACKER — App Entry Point
// ============================================

import { router } from './core/router.js';
import { state } from './core/state.js';
import { events, EVENTS } from './core/events.js';
import { renderNavbar, renderMobileNav, updateNavActive, injectNavbarStyles } from './components/navbar.js';
import { toastManager } from './components/toast.js';

// Pages
import { OnboardingPage } from './pages/onboarding.js';
import { DashboardPage } from './pages/dashboard.js';
import { LogEntryPage } from './pages/log-entry.js';
import { AnalyticsPage } from './pages/analytics.js';
import { ProfilePage } from './pages/profile.js';
import { PlannerPage } from './pages/planner-page.js';
import { GoalsPage } from './pages/goals.js';
import { EnforcerPage } from './pages/enforcer-page.js';
import { RewardsPage } from './pages/rewards.js';
import { InsightsPage } from './pages/insights.js';
import { SettingsPage } from './pages/settings.js';

class App {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Inject navbar styles
    injectNavbarStyles();

    // Check if user exists
    const user = state.get('user');
    const isOnboarding = !user;

    if (isOnboarding) {
      this.renderOnboardingMode();
    } else {
      this.renderAppMode();
    }

    // Listen for route changes to update nav
    events.on(EVENTS.ROUTE_CHANGED, () => {
      updateNavActive();
      this.refreshNavbar();
    });

    // Listen for state changes that affect navbar
    events.on(EVENTS.XP_GAINED, () => this.refreshNavbar());
    events.on(EVENTS.LEVEL_UP, (data) => {
      this.refreshNavbar();
      events.emit(EVENTS.TOAST_SHOW, {
        type: 'success',
        title: `🎉 Level Up!`,
        message: `You've reached Level ${data.level} — ${data.name}!`,
        duration: 6000,
      });
    });
    events.on(EVENTS.STREAK_UPDATED, () => this.refreshNavbar());
  }

  renderOnboardingMode() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '<div id="app-content"></div>';
    appEl.className = '';

    // Register only onboarding
    router.register('/onboarding', () => OnboardingPage());
    router.init('app-content');
    
    if (!window.location.hash || window.location.hash !== '#/onboarding') {
      router.navigate('/onboarding');
    }
  }

  renderAppMode() {
    const appEl = document.getElementById('app');
    appEl.className = 'app-layout';
    appEl.innerHTML = `
      <aside class="app-sidebar" id="app-sidebar">
        ${renderNavbar()}
      </aside>
      <main class="app-main">
        <div id="app-content"></div>
      </main>
      ${renderMobileNav()}
    `;

    // Register routes
    router.register('/dashboard', () => DashboardPage());
    router.register('/log', () => LogEntryPage());
    router.register('/analytics', () => AnalyticsPage());
    router.register('/profile', () => ProfilePage());
    router.register('/planner', () => PlannerPage());
    router.register('/goals', () => GoalsPage());
    router.register('/enforcer', () => EnforcerPage());
    router.register('/rewards', () => RewardsPage());
    router.register('/insights', () => InsightsPage());
    router.register('/settings', () => SettingsPage());

    // Route guard
    router.guard((path) => {
      if (!state.get('user') && path !== '/onboarding') {
        return '/onboarding';
      }
      return null;
    });

    // Init router
    router.init('app-content');

    // Navigate to dashboard if no hash
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/onboarding') {
      router.navigate('/dashboard');
    }

    // Mobile menu toggle
    this.setupMobileMenu();
  }

  refreshNavbar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.innerHTML = renderNavbar();
    }
  }

  setupMobileMenu() {
    // Add hamburger menu for mobile
    const main = document.querySelector('.app-main');
    if (main && window.innerWidth <= 768) {
      const menuBtn = document.createElement('button');
      menuBtn.className = 'btn btn-icon btn-ghost';
      menuBtn.style.cssText = 'position:fixed; top: 12px; left: 12px; z-index: 250; background: var(--bg-secondary); border: 1px solid var(--glass-border);';
      menuBtn.innerHTML = '☰';
      menuBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        sidebar?.classList.toggle('open');
      });
      document.body.appendChild(menuBtn);

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

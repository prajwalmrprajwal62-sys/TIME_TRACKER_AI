// ============================================
// STD TIME TRACKER — App Entry Point (v3.0)
// ============================================

import { router } from './core/router.js';
import { state } from './core/state.js';
import { events, EVENTS } from './core/events.js';
import { api } from './core/api.js';
import { renderNavbar, renderMobileNav, updateNavActive, injectNavbarStyles } from './components/navbar.js';
import { toastManager } from './components/toast.js';

// Pages
import { LoginPage } from './pages/login.js';
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
import { WeeklyReviewPage } from './pages/weekly-review.js';

class App {
  constructor() {
    this.initialized = false;
    this.backendOnline = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Inject navbar styles
    injectNavbarStyles();

    // Check backend connection (non-blocking)
    const health = await api.checkConnection();
    this.backendOnline = !!health;

    // Store connection status globally
    window.__timeforge_backend = this.backendOnline;
    window.__timeforge_ai = health?.ai_configured || false;

    // Determine boot mode
    const hasToken = api.isAuthenticated;
    const hasLocalUser = !!state.get('user');
    const hash = window.location.hash;

    if (this.backendOnline && hasToken) {
      // Authenticated with backend — validate token
      try {
        const profile = await api.getProfile();
        // Sync profile to local state
        state.set('user', {
          name: profile.name,
          wakeTime: profile.wake_time,
          sleepTime: profile.sleep_time,
          role: profile.role || 'student',
          goals: [],
          createdAt: profile.created_at,
        });
        // Start sync queue auto-retry
        api.startSyncQueue();
        this.renderAppMode();
      } catch (e) {
        // Token expired — show login
        api.logout();
        this.renderLoginMode();
      }
    } else if (this.backendOnline && !hasToken && !hasLocalUser) {
      // Backend available, no auth, no local data — show login
      this.renderLoginMode();
    } else if (hasLocalUser) {
      // Has local data (offline mode or skipped login)
      this.renderAppMode();
    } else {
      // Nothing — show login if backend up, otherwise onboarding
      if (this.backendOnline) {
        this.renderLoginMode();
      } else {
        this.renderOnboardingMode();
      }
    }

    // Global event listeners
    events.on(EVENTS.ROUTE_CHANGED, () => {
      updateNavActive();
      this.refreshNavbar();
    });

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

    // Backend sync on key events (fire and forget)
    if (this.backendOnline && api.isAuthenticated) {
      events.on(EVENTS.LOG_CREATED, (log) => {
        api.writeWithFallback('/logs', 'POST', {
          activity: log.activity,
          category: log.category,
          start_time: log.startTime,
          end_time: log.endTime,
          duration: log.duration,
          mood: log.mood,
          energy: log.energy,
          notes: log.notes || '',
          friction_reason: log.frictionReason || null,
          friction_text: log.frictionText || null,
          date: log.date,
        }, `Log: ${log.activity}`);
      });

      events.on(EVENTS.COMPLIANCE_UPDATED, (data) => {
        const rewards = state.get('rewards');
        const streaks = state.get('streaks');
        const summary = data.summary || {};
        api.writeWithFallback('/rewards/process-day', 'POST', {
          date: data.date,
          xp_earned: 0,
          compliance_score: data.compliance.score,
          deep_work_minutes: summary.productiveMinutes || 0,
          wasted_minutes: summary.wastedMinutes || 0,
          achievements: rewards?.achievements || [],
          streak_current: streaks?.current || 0,
          streak_best: streaks?.best || 0,
          level: rewards?.level || 1,
          level_name: rewards?.levelName || 'Novice',
        }, `Compliance: ${data.date}`);
      });

      // Process any queued items on boot
      api.processSyncQueue().then(r => {
        if (r.processed > 0) console.log(`[SyncQueue] Boot sync: ${r.processed} items processed`);
      });

      // Check for drift alerts periodically (every 30 minutes)
      this.startAlertChecks();
    }
  }

  async startAlertChecks() {
    const checkAlerts = async () => {
      try {
        const alerts = await api.getPendingAlerts();
        if (alerts && alerts.length > 0) {
          const alert = alerts[0]; // Show most recent
          events.emit(EVENTS.TOAST_SHOW, {
            type: alert.severity === 'critical' ? 'error' : 'warning',
            title: `⚠️ Drift Alert`,
            message: alert.message,
            duration: 10000,
          });
          // Auto-acknowledge after showing
          api.acknowledgeAlert(alert.id, 'seen').catch(() => {});
        }
      } catch (e) { /* ignore if offline */ }
    };
    // Check now and every 30 minutes
    setTimeout(checkAlerts, 10000); // 10 seconds after boot
    setInterval(checkAlerts, 30 * 60 * 1000);
  }

  renderLoginMode() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '<div id="app-content"></div>';
    appEl.className = '';

    router.register('/login', () => LoginPage());
    router.register('/onboarding', () => OnboardingPage());
    router.init('app-content');

    if (!window.location.hash || window.location.hash !== '#/login') {
      router.navigate('/login');
    }
  }

  renderOnboardingMode() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '<div id="app-content"></div>';
    appEl.className = '';

    router.register('/onboarding', () => OnboardingPage());
    router.register('/login', () => LoginPage());
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
    router.register('/weekly-review', () => WeeklyReviewPage());
    router.register('/login', () => LoginPage());

    // Route guard
    router.guard((path) => {
      if (!state.get('user') && path !== '/onboarding' && path !== '/login') {
        return '/login';
      }
      return null;
    });

    // Init router
    router.init('app-content');

    // Navigate to dashboard if no hash
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/onboarding' || window.location.hash === '#/login') {
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

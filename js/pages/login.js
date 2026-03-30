// ============================================
// TimeForge — Login / Register Page
// ============================================

import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';

export function LoginPage() {
  let mode = 'login'; // 'login' | 'register'
  let loading = false;
  let errorMsg = '';
  let backendOnline = null;

  return {
    render() {
      return `
        <div class="login-page">
          <div class="login-container glass-card">
            <div class="login-logo">
              <div class="login-icon">⏱️</div>
              <h1>TimeForge</h1>
              <p class="login-subtitle">Time Intelligence Engine</p>
            </div>

            <div id="login-status" class="login-status">
              <span class="status-dot status-checking"></span>
              Checking backend connection...
            </div>

            <div id="login-tabs" class="login-tabs">
              <button class="login-tab active" data-tab="login">Sign In</button>
              <button class="login-tab" data-tab="register">Create Account</button>
            </div>

            <form id="login-form" class="login-form">
              <div id="name-field" class="form-group" style="display:none;">
                <label class="form-label">YOUR NAME</label>
                <input type="text" id="login-name" class="form-input" placeholder="What should we call you?" autocomplete="name">
              </div>

              <div class="form-group">
                <label class="form-label">EMAIL</label>
                <input type="email" id="login-email" class="form-input" placeholder="your@email.com" autocomplete="email" required>
              </div>

              <div class="form-group">
                <label class="form-label">PASSWORD</label>
                <input type="password" id="login-password" class="form-input" placeholder="••••••••" autocomplete="current-password" required>
              </div>

              <div id="login-error" class="login-error" style="display:none;"></div>

              <button type="submit" id="login-submit" class="btn btn-primary btn-block">
                Sign In
              </button>
            </form>

            <div class="login-divider">
              <span>or</span>
            </div>

            <button id="offline-btn" class="btn btn-ghost btn-block">
              ⚡ Continue Offline (localStorage only)
            </button>

            <p class="login-footer">
              No data leaves your device in offline mode.
            </p>
          </div>
        </div>
      `;
    },

    async mount() {
      // Check backend
      const health = await api.checkConnection();
      const statusEl = document.getElementById('login-status');

      if (health) {
        backendOnline = true;
        statusEl.innerHTML = `
          <span class="status-dot status-online"></span>
          Backend connected ${health.ai_configured ? '• AI Ready 🤖' : '• AI not configured'}
        `;
      } else {
        backendOnline = false;
        statusEl.innerHTML = `
          <span class="status-dot status-offline"></span>
          Backend offline — Use offline mode or start the server
        `;
      }

      // Tab switching
      document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          mode = tab.dataset.tab;
          document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const nameField = document.getElementById('name-field');
          const submitBtn = document.getElementById('login-submit');

          if (mode === 'register') {
            nameField.style.display = 'block';
            submitBtn.textContent = 'Create Account';
          } else {
            nameField.style.display = 'none';
            submitBtn.textContent = 'Sign In';
          }
        });
      });

      // Form submit
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (loading) return;

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const name = document.getElementById('login-name')?.value.trim();
        const errorEl = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit');

        if (!email || !password) {
          errorEl.textContent = 'Email and password are required.';
          errorEl.style.display = 'block';
          return;
        }

        if (mode === 'register' && !name) {
          errorEl.textContent = 'Name is required for registration.';
          errorEl.style.display = 'block';
          return;
        }

        loading = true;
        submitBtn.textContent = 'Connecting...';
        submitBtn.disabled = true;
        errorEl.style.display = 'none';

        try {
          let result;
          if (mode === 'register') {
            result = await api.register(email, password, name);
          } else {
            result = await api.login(email, password);
          }

          // Set user in state for app compatibility
          state.set('user', {
            name: result.user.name,
            wakeTime: result.user.wake_time,
            sleepTime: result.user.sleep_time,
            goals: [],
            createdAt: result.user.created_at,
          });

          // Check if existing localStorage data should be synced
          const existingLogs = state.get('logs') || [];
          if (existingLogs.length > 0 && mode === 'register') {
            submitBtn.textContent = 'Syncing data...';
            try {
              await api.syncAllData(state.get());
            } catch (syncErr) {
              console.warn('Data sync failed:', syncErr);
            }
          }

          // Navigate to app
          window.location.reload();

        } catch (e) {
          errorEl.textContent = e.message;
          errorEl.style.display = 'block';
          loading = false;
          submitBtn.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
          submitBtn.disabled = false;
        }
      });

      // Offline button
      document.getElementById('offline-btn').addEventListener('click', () => {
        // Check if user exists in localStorage
        const user = state.get('user');
        if (user) {
          // Already has data, go to dashboard
          import('../app.js').then(() => window.location.hash = '#/dashboard');
          window.location.reload();
        } else {
          // Need onboarding first
          window.location.hash = '#/onboarding';
          window.location.reload();
        }
      });
    },

    destroy() {},
  };
}

// ============================================
// STD TIME TRACKER — Settings Page
// ============================================

import { state } from '../core/state.js';
import { $ } from '../core/utils.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/modal.js';

export function SettingsPage() {
  function render() {
    const user = state.get('user') || {};
    const settings = state.get('settings') || {};

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Settings</h1>
          <p>Configure your profile, preferences, and data management.</p>
        </div>

        <!-- Profile -->
        <div class="glass-card no-hover mb-6 settings-section">
          <h3>👤 Profile</h3>
          <div class="flex-col gap-4 mt-4">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="set-name" value="${user.name || ''}" placeholder="Your name">
            </div>
            <div class="grid-2" style="gap:var(--space-4);">
              <div class="form-group">
                <label class="form-label">Wake Time</label>
                <input type="time" class="form-input font-mono" id="set-wake" value="${user.wakeTime || '07:00'}">
              </div>
              <div class="form-group">
                <label class="form-label">Sleep Time</label>
                <input type="time" class="form-input font-mono" id="set-sleep" value="${user.sleepTime || '23:00'}">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="save-profile-btn" style="align-self:flex-start;">Save Profile</button>
          </div>
        </div>

        <!-- Preferences -->
        <div class="glass-card no-hover mb-6 settings-section">
          <h3>⚙️ Preferences</h3>
          <div class="mt-4">
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Strict Mode</span>
                <span>Brutally honest feedback when compliance is low</span>
              </div>
              <label class="toggle">
                <input type="checkbox" id="set-strict" ${settings.strictMode !== false ? 'checked' : ''}>
                <div class="toggle-slider"></div>
              </label>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Notifications</span>
                <span>Show toast notifications for achievements and reminders</span>
              </div>
              <label class="toggle">
                <input type="checkbox" id="set-notifications" ${settings.notifications !== false ? 'checked' : ''}>
                <div class="toggle-slider"></div>
              </label>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Pomodoro Length</span>
                <span>Default focus session duration (minutes)</span>
              </div>
              <input type="number" class="form-input font-mono" id="set-pomodoro" value="${settings.pomodoroLength || 25}" min="15" max="60" style="width:80px; text-align:center;">
            </div>
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Break Length</span>
                <span>Default break duration (minutes)</span>
              </div>
              <input type="number" class="form-input font-mono" id="set-break" value="${settings.breakLength || 5}" min="3" max="15" style="width:80px; text-align:center;">
            </div>
          </div>
          <button class="btn btn-secondary btn-sm mt-4" id="save-settings-btn">Save Settings</button>
        </div>

        <!-- Data Management -->
        <div class="glass-card no-hover mb-6 settings-section">
          <h3>💾 Data Management</h3>
          <div class="mt-4">
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Export Data</span>
                <span>Download all your data as a JSON file</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="export-btn">📥 Export</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Import Data</span>
                <span>Restore from a previously exported JSON file</span>
              </div>
              <div>
                <input type="file" id="import-file" accept=".json" style="display:none;">
                <button class="btn btn-secondary btn-sm" id="import-btn">📤 Import</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="glass-card no-hover settings-section" style="border: 1px solid rgba(239,68,68,0.3);">
          <h3 style="color: var(--color-danger);">⚠️ Danger Zone</h3>
          <div class="mt-4">
            <div class="settings-row">
              <div class="settings-row-label">
                <span>Reset All Data</span>
                <span>Permanently delete all logs, goals, and progress. This cannot be undone.</span>
              </div>
              <button class="btn btn-danger btn-sm" id="reset-btn">🗑️ Reset Everything</button>
            </div>
          </div>
        </div>

        <!-- App Info -->
        <div class="text-center mt-8 text-muted text-xs">
          <p>TimeForge — Time Intelligence Engine v1.0</p>
          <p class="mt-1">Built for champions who refuse to be average.</p>
          <p class="mt-1">All data stored locally in your browser. No servers, no tracking.</p>
        </div>
      </div>
    `;
  }

  function mount() {
    // Save profile
    const saveProfile = $('#save-profile-btn');
    if (saveProfile) {
      saveProfile.addEventListener('click', () => {
        const name = $('#set-name')?.value?.trim();
        const wake = $('#set-wake')?.value;
        const sleep = $('#set-sleep')?.value;
        if (name) {
          state.set('user.name', name);
          state.set('user.wakeTime', wake);
          state.set('user.sleepTime', sleep);
          showToast('success', 'Profile saved', 'Your settings have been updated');
        }
      });
    }

    // Save settings
    const saveSettings = $('#save-settings-btn');
    if (saveSettings) {
      saveSettings.addEventListener('click', () => {
        state.set('settings.strictMode', $('#set-strict')?.checked);
        state.set('settings.notifications', $('#set-notifications')?.checked);
        state.set('settings.pomodoroLength', parseInt($('#set-pomodoro')?.value) || 25);
        state.set('settings.breakLength', parseInt($('#set-break')?.value) || 5);
        showToast('success', 'Settings saved');
      });
    }

    // Export
    const exportBtn = $('#export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = state.exportData();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeforge-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Data exported', 'JSON file downloaded');
      });
    }

    // Import
    const importBtn = $('#import-btn');
    const importFile = $('#import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = state.importData(event.target.result);
          if (success) {
            showToast('success', 'Data imported!', 'All data restored from file');
            setTimeout(() => location.reload(), 1000);
          } else {
            showToast('error', 'Import failed', 'Invalid JSON file');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset
    const resetBtn = $('#reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        showConfirm({
          title: '⚠️ Reset All Data?',
          message: 'This will permanently delete ALL your logs, goals, streaks, rewards, and settings. This action cannot be undone. Are you absolutely sure?',
          confirmText: 'Yes, Delete Everything',
          danger: true,
          onConfirm: () => {
            state.reset();
            showToast('info', 'Data reset', 'All data has been cleared');
            setTimeout(() => location.reload(), 1000);
          }
        });
      });
    }
  }

  return { render, mount };
}

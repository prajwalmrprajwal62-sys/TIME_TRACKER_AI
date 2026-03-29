// ============================================
// STD TIME TRACKER — Toast Component
// ============================================

import { events, EVENTS } from '../core/events.js';

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    events.on(EVENTS.TOAST_SHOW, (data) => this.show(data));
  }

  ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show({ type = 'info', title, message, duration = 4000 }) {
    this.ensureContainer();

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;

    this.container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export const toastManager = new ToastManager();

export function showToast(type, title, message, duration) {
  events.emit(EVENTS.TOAST_SHOW, { type, title, message, duration });
}

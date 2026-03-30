// ============================================
// STD TIME TRACKER — Navbar Component
// ============================================

import { router } from '../core/router.js';
import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';
import { ICONS } from '../core/utils.js';
import { LEVEL_THRESHOLDS } from '../data/rewards-bank.js';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/log', label: 'Log Activity', icon: 'log' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/profile', label: 'My Profile', icon: 'profile' },
  { path: '/planner', label: 'Planner', icon: 'planner' },
  { path: '/goals', label: 'Goals', icon: 'goals' },
  { path: '/enforcer', label: 'Enforcer', icon: 'enforcer' },
  { path: '/rewards', label: 'Rewards', icon: 'rewards' },
  { path: '/insights', label: 'Insights', icon: 'insights' },
  { path: '/weekly-review', label: 'Weekly Review', icon: 'review' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export function renderNavbar() {
  const user = state.get('user');
  const level = state.get('rewards.level') || 1;
  const levelName = state.get('rewards.levelName') || 'Novice';
  const xp = state.get('rewards.xp') || 0;
  const streak = state.get('streaks.current') || 0;
  const levelData = LEVEL_THRESHOLDS.find(l => l.level === level);
  const levelProgress = state.getLevelProgress();

  const currentRoute = window.location.hash.slice(1) || '/dashboard';

  return `
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon gradient-animate" style="background: var(--gradient-primary); width:36px; height:36px; border-radius: var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:18px;">⏱️</div>
          <div class="logo-text">
            <span class="logo-title">TimeForge</span>
            <span class="logo-subtitle">Intelligence Engine</span>
          </div>
        </div>
      </div>

      ${user ? `
      <div class="sidebar-profile">
        <div class="avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
        <div class="profile-info">
          <span class="profile-name">${user.name || 'Student'}</span>
          <div class="level-display-mini">
            <span class="level-emoji">${levelData?.emoji || '🌱'}</span>
            <span class="level-text">Lv.${level} ${levelName}</span>
          </div>
        </div>
        ${streak > 0 ? `
        <div class="streak-flame" style="margin-left:auto; padding: 4px 8px; font-size: 12px;">
          <span class="flame-icon">🔥</span>
          <span>${streak}</span>
        </div>` : ''}
      </div>

      <div class="sidebar-xp">
        <div class="xp-mini-bar">
          <div class="xp-mini-fill" style="width:${levelProgress.percent}%"></div>
        </div>
        <span class="xp-mini-text">${xp} XP</span>
      </div>
      ` : ''}

      <nav class="sidebar-nav">
        ${NAV_ITEMS.map(item => `
          <a href="#${item.path}" 
             class="nav-item ${currentRoute === item.path ? 'active' : ''}" 
             id="nav-${item.icon}"
             data-path="${item.path}">
            <div class="nav-icon">${ICONS[item.icon] || ''}</div>
            <span class="nav-label">${item.label}</span>
            ${currentRoute === item.path ? '<div class="nav-active-indicator"></div>' : ''}
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-version">v3.0 — Built for Champions</div>
      </div>
    </div>
  `;
}

export function renderMobileNav() {
  const currentRoute = window.location.hash.slice(1) || '/dashboard';
  const mobileItems = NAV_ITEMS.slice(0, 5); // Show first 5 on mobile

  return `
    <div class="mobile-nav" id="mobile-nav">
      ${mobileItems.map(item => `
        <a href="#${item.path}" class="mobile-nav-item ${currentRoute === item.path ? 'active' : ''}">
          <div style="width:22px; height:22px;">${ICONS[item.icon] || ''}</div>
          <span>${item.label.split(' ')[0]}</span>
        </a>
      `).join('')}
    </div>
  `;
}

export function updateNavActive() {
  const currentRoute = window.location.hash.slice(1) || '/dashboard';
  document.querySelectorAll('.nav-item').forEach(el => {
    const path = el.getAttribute('data-path');
    el.classList.toggle('active', path === currentRoute);
    const indicator = el.querySelector('.nav-active-indicator');
    if (path === currentRoute && !indicator) {
      el.insertAdjacentHTML('beforeend', '<div class="nav-active-indicator"></div>');
    } else if (path !== currentRoute && indicator) {
      indicator.remove();
    }
  });

  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    const path = el.getAttribute('href')?.slice(1);
    el.classList.toggle('active', path === currentRoute);
  });
}

// Navbar styles (injected once)
export function injectNavbarStyles() {
  if (document.getElementById('navbar-styles')) return;
  const style = document.createElement('style');
  style.id = 'navbar-styles';
  style.textContent = `
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: rgba(12, 12, 20, 0.95);
      backdrop-filter: blur(20px);
      border-right: 1px solid var(--glass-border);
      padding: var(--space-4);
    }

    .sidebar-header {
      padding: var(--space-4) var(--space-2);
      margin-bottom: var(--space-4);
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .logo-title {
      font-size: var(--text-lg);
      font-weight: 800;
      letter-spacing: -0.02em;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-subtitle {
      display: block;
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .sidebar-profile {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--glass-bg);
      border-radius: var(--radius-md);
      border: 1px solid var(--glass-border);
      margin-bottom: var(--space-2);
    }

    .profile-info {
      flex: 1;
      min-width: 0;
    }

    .profile-name {
      font-weight: 600;
      font-size: var(--text-sm);
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .level-display-mini {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .level-emoji { font-size: 12px; }

    .sidebar-xp {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-3);
      margin-bottom: var(--space-6);
    }

    .xp-mini-bar {
      flex: 1;
      height: 4px;
      background: var(--bg-elevated);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .xp-mini-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius-full);
      transition: width 800ms ease;
    }

    .xp-mini-text {
      font-size: 10px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      transition: all var(--transition-fast);
      position: relative;
      text-decoration: none;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: rgba(124, 58, 237, 0.12);
      color: var(--accent-primary-light);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-icon svg { width: 18px; height: 18px; }

    .nav-active-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: var(--gradient-primary);
      border-radius: 0 3px 3px 0;
    }

    .sidebar-footer {
      padding: var(--space-4) var(--space-2);
      border-top: 1px solid var(--glass-border);
      margin-top: var(--space-4);
    }

    .sidebar-version {
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

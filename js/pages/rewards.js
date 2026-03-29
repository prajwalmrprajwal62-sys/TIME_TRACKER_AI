// ============================================
// STD TIME TRACKER — Rewards Page
// ============================================

import { state } from '../core/state.js';
import { formatDate, daysAgo } from '../core/utils.js';
import { enforcer } from '../agents/enforcer.js';
import { ACHIEVEMENTS, LEVEL_THRESHOLDS, REAL_WORLD_REWARDS } from '../data/rewards-bank.js';

export function RewardsPage() {
  function render() {
    const rewardStatus = enforcer.getRewardStatus();
    const levelProgress = state.getLevelProgress();
    const unlockedIds = state.get('rewards.achievements') || [];
    const streakHistory = state.get('streaks.history') || [];

    // Build streak calendar (last 35 days)
    const calendarDays = [];
    for (let i = 34; i >= 0; i--) {
      const date = daysAgo(i);
      const entry = streakHistory.find(h => h.date === date);
      calendarDays.push({
        date,
        compliance: entry?.compliance || 0,
        hasData: !!entry,
      });
    }

    const currentLevel = LEVEL_THRESHOLDS.find(l => l.level === rewardStatus.level) || LEVEL_THRESHOLDS[0];
    const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === rewardStatus.level + 1);

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Rewards & Progress</h1>
          <p>Earn XP through discipline. Unlock rewards through consistency. No shortcuts.</p>
        </div>

        <!-- Level & XP -->
        <div class="glass-card no-hover mb-6">
          <div class="flex items-center gap-6 mb-6">
            <div class="avatar-lg" style="width:80px; height:80px; font-size:40px; background: var(--gradient-primary); border-radius: var(--radius-lg);">
              ${currentLevel.emoji}
            </div>
            <div style="flex:1;">
              <div class="text-xs text-muted font-semibold" style="text-transform:uppercase; letter-spacing:0.08em;">CURRENT LEVEL</div>
              <div class="text-2xl font-bold">Lv.${rewardStatus.level} — ${rewardStatus.levelName}</div>
              ${nextLevel ? `<div class="text-sm text-secondary mt-1">${nextLevel.threshold - rewardStatus.xp} XP to ${nextLevel.name}</div>` : '<div class="text-sm text-success mt-1">MAX LEVEL REACHED! 🏆</div>'}
            </div>
            <div class="text-right">
              <div class="font-mono text-3xl font-bold" style="background: var(--gradient-primary); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${rewardStatus.xp}</div>
              <div class="text-xs text-muted">Total XP</div>
            </div>
          </div>

          <div class="xp-bar-container">
            <div class="xp-bar-header text-xs text-muted">
              <span>${currentLevel.emoji} ${currentLevel.name}</span>
              <span>${levelProgress.current} / ${levelProgress.needed} XP</span>
              ${nextLevel ? `<span>${nextLevel.emoji} ${nextLevel.name}</span>` : ''}
            </div>
            <div class="xp-bar">
              <div class="xp-bar-fill" style="width:${levelProgress.percent}%;"></div>
            </div>
          </div>
        </div>

        <!-- Streak & Stats -->
        <div class="grid-3 mb-6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-warning-soft); font-size:24px;">🔥</div>
            <div class="stat-label">Current Streak</div>
            <div class="stat-value text-warning">${rewardStatus.currentStreak} days</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(124,58,237,0.15); font-size:24px;">⭐</div>
            <div class="stat-label">Best Streak</div>
            <div class="stat-value">${rewardStatus.bestStreak} days</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-success-soft); font-size:24px;">🏅</div>
            <div class="stat-label">Achievements</div>
            <div class="stat-value">${rewardStatus.achievements}/${rewardStatus.totalAchievements}</div>
          </div>
        </div>

        <!-- Streak Calendar -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🗓️ STREAK CALENDAR (LAST 35 DAYS)</h3>
          <div class="streak-calendar" style="max-width: 350px;">
            ${calendarDays.map(d => {
              const isToday = d.date === daysAgo(0);
              let cls = '';
              if (d.hasData && d.compliance >= 50) cls = 'completed';
              else if (d.hasData && d.compliance < 50) cls = 'failed';
              if (isToday) cls += ' today';
              
              return `<div class="streak-day ${cls} tooltip" data-tooltip="${formatDate(d.date)}: ${d.hasData ? d.compliance + '%' : 'No data'}">${new Date(d.date + 'T00:00:00').getDate()}</div>`;
            }).join('')}
          </div>
          <div class="flex items-center gap-4 mt-3 text-xs text-muted">
            <div class="flex items-center gap-1"><div class="streak-day completed" style="width:16px;height:16px;font-size:0;"></div> ≥50%</div>
            <div class="flex items-center gap-1"><div class="streak-day failed" style="width:16px;height:16px;font-size:0;"></div> <50%</div>
            <div class="flex items-center gap-1"><div class="streak-day" style="width:16px;height:16px;font-size:0;"></div> No data</div>
          </div>
        </div>

        <!-- Level Progression -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📈 LEVEL PROGRESSION</h3>
          <div class="flex-col gap-2">
            ${LEVEL_THRESHOLDS.map(l => {
              const isReached = rewardStatus.level >= l.level;
              const isCurrent = rewardStatus.level === l.level;
              return `
                <div class="flex items-center gap-3 p-3" style="background: ${isCurrent ? 'rgba(124,58,237,0.1)' : 'var(--glass-bg)'}; border-radius: var(--radius-md); border: ${isCurrent ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)'}; ${!isReached ? 'opacity: 0.4;' : ''}">
                  <span style="font-size:20px;">${l.emoji}</span>
                  <span class="font-semibold text-sm" style="min-width:100px;">Lv.${l.level} ${l.name}</span>
                  <span class="text-xs font-mono text-muted">${l.threshold} XP</span>
                  ${isReached ? '<span class="text-success ml-auto text-sm">✓</span>' : ''}
                  ${isCurrent ? '<span class="badge badge-info ml-auto" style="font-size:10px;">CURRENT</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Achievements -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🏆 ACHIEVEMENTS</h3>
          <div class="achievements-grid">
            ${ACHIEVEMENTS.map(a => {
              const unlocked = unlockedIds.includes(a.id);
              return `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                  <span class="ach-icon">${a.emoji}</span>
                  <div class="ach-name">${a.name}</div>
                  <div class="ach-desc">${a.description}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Real World Rewards -->
        <div class="glass-card no-hover">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🎁 EARNED REAL-WORLD REWARDS</h3>
          <p class="text-xs text-muted mb-4">These rewards are unlocked through consistent streaks. No shortcuts — earn them the hard way.</p>
          <div class="flex-col gap-3">
            ${REAL_WORLD_REWARDS.map(r => {
              const unlocked = rewardStatus.currentStreak >= r.streakRequired;
              return `
                <div class="flex items-center gap-4 p-4" style="background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid ${unlocked ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}; ${!unlocked ? 'opacity:0.5;' : ''}">
                  <span style="font-size:24px;">${unlocked ? '🎉' : '🔒'}</span>
                  <div style="flex:1;">
                    <div class="font-semibold text-sm">${r.name}</div>
                    <div class="text-xs text-muted">${r.description}</div>
                  </div>
                  <div class="text-right">
                    ${unlocked ? '<span class="badge badge-success">UNLOCKED</span>' : `
                      <div class="text-xs font-mono text-muted">${r.streakRequired}-day streak</div>
                      <div class="progress-bar mt-1" style="width:80px; height:4px;">
                        <div class="progress-bar-fill" style="width:${Math.min(100, (rewardStatus.currentStreak / r.streakRequired) * 100)}%;"></div>
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function mount() {}

  return { render, mount };
}

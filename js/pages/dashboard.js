// ============================================
// STD TIME TRACKER — Dashboard Page
// ============================================

import { state } from '../core/state.js';
import { today, formatDate, formatDuration, formatTime, animateNumber, CATEGORY_EMOJIS, getCategoryColor } from '../core/utils.js';
import { collector } from '../agents/collector.js';
import { analyzer } from '../agents/analyzer.js';
import { enforcer } from '../agents/enforcer.js';
import { DonutChart } from '../components/charts.js';
import { CATEGORIES } from '../data/categories.js';
import {
  SDG_BENCHMARKS,
  calculateSDGScore,
  calculatePercentile,
  getSDGLevel,
  calculateWorkLifeBalance,
} from '../data/sdg-benchmarks.js';

export function DashboardPage() {
  let donutChart = null;

  function render() {
    const todayDate = today();
    const summary = collector.getDailySummary(todayDate);
    const compliance = enforcer.calculateCompliance(todayDate);
    const streak = state.get('streaks.current') || 0;
    const analysis = analyzer.analyzeDay(todayDate);
    const user = state.get('user');
    const levelProgress = state.getLevelProgress();
    const level = state.get('rewards.level') || 1;
    const levelName = state.get('rewards.levelName') || 'Novice';

    // Get a random insight for the ticker
    const tickerInsight = analysis.insights.length > 0
      ? analysis.insights[Math.floor(Math.random() * analysis.insights.length)].text
      : 'Start logging activities to see data-driven insights here. Every entry makes the system smarter.';

    return `
      <div class="page-container stagger-children">
        <div class="page-header flex justify-between items-center">
          <div>
            <h1>Dashboard</h1>
            <p>${formatDate(todayDate)} — ${getTimeGreeting()}, ${user?.name || 'Student'}</p>
          </div>
          <a href="#/log" class="btn btn-primary" id="dash-log-btn">
            + Log Activity
          </a>
        </div>

        <!-- Insight Ticker -->
        <div class="insight-ticker" id="insight-ticker">
          <div class="insight-ticker-content">
            <span class="insight-ticker-label">💡 INSIGHT</span>
            <span>${tickerInsight}</span>
          </div>
        </div>

        <!-- Hero Stats -->
        <div class="dashboard-hero">
          <div class="stat-card" id="stat-productive">
            <div class="stat-icon" style="background: var(--color-success-soft);">🎯</div>
            <div class="stat-label">Productive Time</div>
            <div class="stat-value text-success" id="val-productive">${formatDuration(summary.productiveMinutes)}</div>
            <div class="stat-change ${summary.productiveMinutes > 120 ? 'positive' : 'negative'}">
              ${summary.productiveMinutes > 120 ? '↑' : '↓'} ${summary.logCount > 0 ? 'Today' : 'No data yet'}
            </div>
          </div>

          <div class="stat-card" id="stat-wasted">
            <div class="stat-icon" style="background: var(--color-danger-soft);">📱</div>
            <div class="stat-label">Wasted Time</div>
            <div class="stat-value text-danger" id="val-wasted">${formatDuration(summary.wastedMinutes)}</div>
            <div class="stat-change negative">
              ${summary.wastedMinutes > 0 ? `${Math.round((summary.wastedMinutes / (summary.totalMinutes || 1)) * 100)}% of total` : 'Clean so far'}
            </div>
          </div>

          <div class="stat-card" id="stat-compliance">
            <div class="stat-icon" style="background: var(--color-info-soft);">🛡️</div>
            <div class="stat-label">Compliance</div>
            <div class="stat-value" style="color: ${getComplianceColor(compliance.score)}" id="val-compliance">${compliance.score}%</div>
            <div class="stat-change">
              ${compliance.hasPlan ? 'Plan tracked' : 'No plan yet'}
            </div>
          </div>

          <div class="stat-card" id="stat-streak">
            <div class="stat-icon" style="background: var(--color-warning-soft);">🔥</div>
            <div class="stat-label">Streak</div>
            <div class="stat-value text-warning" id="val-streak">${streak} days</div>
            <div class="stat-change ${streak > 0 ? 'positive' : ''}">
              ${streak > 0 ? 'Keep it going!' : 'Start today'}
            </div>
          </div>
        </div>

        <!-- SDG 8 Productivity Index -->
        ${renderSDGIndex(summary, compliance, streak)}

        <!-- Main Grid -->
        <div class="dashboard-grid">
          <!-- Donut Chart -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4" style="font-size: var(--text-base);">Today's Time Distribution</h3>
            <div class="flex items-center gap-8">
              <div class="chart-container" style="min-height:180px; width:180px; flex-shrink:0;">
                <canvas id="dash-donut" width="180" height="180"></canvas>
              </div>
              <div class="flex-col gap-3" style="flex:1;">
                ${CATEGORIES.filter(c => (summary.categories[c.name]?.minutes || 0) > 0).map(c => `
                  <div class="flex items-center justify-between gap-3" style="font-size: var(--text-sm);">
                    <div class="flex items-center gap-2">
                      <div class="category-dot" style="background: ${c.color};"></div>
                      <span>${c.icon} ${c.name}</span>
                    </div>
                    <span class="font-mono text-secondary" style="font-size: var(--text-xs);">
                      ${formatDuration(summary.categories[c.name].minutes)}
                    </span>
                  </div>
                `).join('')}
                ${summary.logCount === 0 ? `
                  <div class="text-center text-muted" style="padding: var(--space-6);">
                    <p>No activities logged yet today.</p>
                    <a href="#/log" class="btn btn-primary btn-sm mt-4">Log Now</a>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Quick Stats / Profile -->
          <div class="flex-col gap-6">
            <!-- XP Progress -->
            <div class="glass-card no-hover">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold">Level ${level} — ${levelName}</span>
                <span class="text-xs font-mono text-muted">${levelProgress.current}/${levelProgress.needed} XP</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${levelProgress.percent}%;"></div>
              </div>
            </div>

            <!-- User Type -->
            ${analysis.userType ? `
            <div class="glass-card no-hover" style="border-left: 3px solid var(--accent-primary);">
              <div class="text-xs font-semibold text-muted mb-2" style="text-transform:uppercase; letter-spacing: 0.08em;">BEHAVIORAL PROFILE</div>
              <div class="text-lg font-bold">${analysis.userType}</div>
              <a href="#/profile" class="text-xs text-secondary mt-2" style="display:block;">View full analysis →</a>
            </div>
            ` : `
            <div class="glass-card no-hover">
              <div class="text-xs font-semibold text-muted mb-2" style="text-transform:uppercase; letter-spacing: 0.08em;">BEHAVIORAL PROFILE</div>
              <div class="text-sm text-secondary">Log activities for 3+ days to detect your profile</div>
            </div>
            `}

            <!-- Gaps Alert -->
            ${summary.gaps.length > 0 ? `
            <div class="glass-card no-hover" style="border-left: 3px solid var(--color-warning);">
              <div class="text-xs font-semibold text-warning mb-2" style="text-transform:uppercase; letter-spacing: 0.08em;">⚠️ UNTRACKED TIME</div>
              ${summary.gaps.slice(0, 3).map(g => `
                <div class="text-sm text-secondary mb-1">
                  ${formatTime(g.start)} → ${formatTime(g.end)} (${formatDuration(g.duration)})
                </div>
              `).join('')}
              <a href="#/log" class="text-xs mt-2" style="color: var(--color-warning); display:block;">Log missing time →</a>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="dashboard-grid-full">
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4" style="font-size: var(--text-base);">Today's Activity Timeline</h3>
            ${summary.logCount > 0 ? `
              <div class="timeline">
                ${state.getLogsForDate(todayDate).map(log => `
                  <div class="timeline-item completed">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-semibold text-sm">${log.activity}</span>
                      <span class="badge ${getBadgeClass(log.category)}">${log.category}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-muted">
                      <span class="font-mono">${formatTime(log.startTime)} — ${formatTime(log.endTime)}</span>
                      <span>·</span>
                      <span>${formatDuration(log.duration)}</span>
                      <span>·</span>
                      <span>${getMoodEmoji(log.mood)} · ⚡${log.energy}/5</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state" style="padding: var(--space-8);">
                <div class="empty-icon">📝</div>
                <h3>No activities logged today</h3>
                <p>Start tracking your time to see patterns emerge.</p>
                <a href="#/log" class="btn btn-primary mt-4">Log Your First Activity</a>
              </div>
            `}
          </div>

          <!-- Insights Panel -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4" style="font-size: var(--text-base);">🧠 Today's Insights</h3>
            ${analysis.insights.length > 0 ? `
              <div class="flex-col gap-4">
                ${analysis.insights.map(insight => `
                  <div class="insight-card glass-card no-hover" style="padding: var(--space-4); border-left-color: ${getCategoryColor(insight.category)};">
                    <div class="insight-category" style="color: ${getCategoryColor(insight.category)};">${insight.category}</div>
                    <div class="insight-text text-sm">${insight.text}</div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center text-muted" style="padding: var(--space-8);">
                <p class="text-lg mb-2">🔍</p>
                <p>Insights will appear as you log more data.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function mount() {
    // Initialize donut chart
    const canvas = document.getElementById('dash-donut');
    if (canvas) {
      const summary = collector.getDailySummary(today());
      const chartData = CATEGORIES
        .filter(c => (summary.categories[c.name]?.minutes || 0) > 0)
        .map(c => ({
          label: c.name,
          value: summary.categories[c.name].minutes,
          color: c.color,
        }));

      donutChart = new DonutChart(canvas, {
        data: chartData,
        size: 180,
        lineWidth: 20,
        centerText: formatDuration(summary.totalMinutes),
        centerSubText: 'Total Tracked',
      });
      donutChart.draw();
    }
  }

  function destroy() {
    donutChart = null;
  }

  return { render, mount, destroy };
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night';
}

function getComplianceColor(score) {
  if (score >= 90) return 'var(--color-success)';
  if (score >= 70) return '#34d399';
  if (score >= 50) return 'var(--color-warning)';
  if (score >= 30) return '#f97316';
  return 'var(--color-danger)';
}

function getMoodEmoji(mood) {
  const moods = ['😫', '😟', '😐', '🙂', '😄'];
  return moods[(mood || 3) - 1] || '😐';
}

function getBadgeClass(category) {
  return 'badge-' + category.toLowerCase().replace(/\s+/g, '-');
}

function renderSDGIndex(summary, compliance, streak) {
  const deepWorkHours = (summary.categories['Deep Work']?.minutes || 0) / 60;
  const wastedHours = summary.wastedMinutes / 60;

  const sdgScore = calculateSDGScore({
    deepWorkHours,
    compliancePercent: compliance.score,
    streakDays: streak,
    wastedHours,
  });
  const sdgLevel = getSDGLevel(sdgScore);
  const deepWorkPercentile = calculatePercentile(deepWorkHours, 'deepWork');
  const compliancePercentile = calculatePercentile(compliance.score, 'compliance');
  const streakPercentile = calculatePercentile(streak, 'streak');
  const balanceScore = calculateWorkLifeBalance(
    summary.productiveMinutes,
    summary.wastedMinutes,
    summary.totalMinutes
  );

  // SVG gauge calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (sdgScore / 100) * circumference;

  const benchmarks = SDG_BENCHMARKS.students;

  return `
    <div class="sdg-index-section" id="sdg-index">
      <div class="sdg-index-header">
        <div class="sdg-index-title">
          <div style="width:28px; height:28px; border-radius:6px; background:var(--sdg8-primary); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:white;">8</div>
          <h3>SDG 8 Productivity Index</h3>
        </div>
        <div class="sdg-badge">
          <span class="sdg-badge-icon">8</span>
          <span>Target 8.5</span>
        </div>
      </div>

      <div class="sdg-gauge-container">
        <!-- Circular Gauge -->
        <div class="sdg-gauge">
          <svg viewBox="0 0 140 140">
            <circle class="gauge-bg" cx="70" cy="70" r="${radius}" />
            <circle class="gauge-fill" cx="70" cy="70" r="${radius}"
              stroke="${sdgLevel.color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}" />
          </svg>
          <div class="sdg-gauge-text">
            <span class="sdg-gauge-score" style="color: ${sdgLevel.color}">${sdgScore}</span>
            <span class="sdg-gauge-label">${sdgLevel.emoji} ${sdgLevel.label}</span>
          </div>
        </div>

        <!-- Comparison Cards -->
        <div class="sdg-comparison-grid">
          <div class="sdg-comparison-card">
            <div class="sdg-comparison-label">🎯 Deep Work</div>
            <div class="sdg-comparison-value" style="color: ${deepWorkHours >= benchmarks.deepWorkHoursDaily ? 'var(--color-success)' : 'var(--color-warning)'}">${deepWorkHours.toFixed(1)}h</div>
            <div class="sdg-comparison-vs">Global avg: ${benchmarks.deepWorkHoursDaily}h/day</div>
            <div class="sdg-comparison-rank ${deepWorkPercentile >= 50 ? 'above' : 'below'}">
              ${deepWorkPercentile >= 50 ? `Top ${100 - deepWorkPercentile}%` : `${deepWorkPercentile}th percentile`}
            </div>
          </div>

          <div class="sdg-comparison-card">
            <div class="sdg-comparison-label">🛡️ Compliance</div>
            <div class="sdg-comparison-value" style="color: ${compliance.score >= benchmarks.compliancePercent ? 'var(--color-success)' : 'var(--color-warning)'}">${compliance.score}%</div>
            <div class="sdg-comparison-vs">Global avg: ${benchmarks.compliancePercent}%</div>
            <div class="sdg-comparison-rank ${compliancePercentile >= 50 ? 'above' : 'below'}">
              ${compliancePercentile >= 50 ? `Top ${100 - compliancePercentile}%` : `${compliancePercentile}th percentile`}
            </div>
          </div>

          <div class="sdg-comparison-card">
            <div class="sdg-comparison-label">🔥 Streak</div>
            <div class="sdg-comparison-value" style="color: ${streak >= benchmarks.avgStreakDays ? 'var(--color-success)' : 'var(--color-warning)'}">${streak}d</div>
            <div class="sdg-comparison-vs">Global avg: ${benchmarks.avgStreakDays}d</div>
            <div class="sdg-comparison-rank ${streakPercentile >= 50 ? 'above' : 'below'}">
              ${streakPercentile >= 50 ? `Top ${100 - streakPercentile}%` : `${streakPercentile}th percentile`}
            </div>
          </div>
        </div>
      </div>

      <!-- SDG Banner -->
      <div class="sdg-banner mt-4">
        <span class="sdg-banner-icon">🏢</span>
        <span><strong>Contributing to SDG 8.5</strong> — Your productive time of ${deepWorkHours.toFixed(1)}h/day ${deepWorkHours >= SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours
          ? 'meets sustainable productivity targets. Keep building!'
          : `is ${(SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours - deepWorkHours).toFixed(1)}h below the sustainable target of ${SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours}h. Every hour counts.`
        } Work-life balance: ${balanceScore}%</span>
      </div>
    </div>
  `;
}


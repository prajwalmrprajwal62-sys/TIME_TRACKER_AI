// ============================================
// STD TIME TRACKER — Profile Page
// ============================================

import { state } from '../core/state.js';
import { formatDuration, daysAgo, mean } from '../core/utils.js';
import { analyzer } from '../agents/analyzer.js';
import { collector } from '../agents/collector.js';
import { CATEGORIES } from '../data/categories.js';
import { INSIGHTS } from '../data/insights-bank.js';

export function ProfilePage() {
  function render() {
    const userType = analyzer.classifyUserType();
    const user = state.get('user');
    const weekAnalysis = analyzer.analyzeWeek();
    const typeInfo = userType ? INSIGHTS.userTypes[userType] : null;

    // Compute averages
    const avgStats = computeAverages();

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Behavioral Profile</h1>
          <p>Your data tells a story. Here's what the numbers reveal about your patterns.</p>
        </div>

        <!-- User Archetype -->
        <div class="glass-card no-hover profile-archetype mb-8">
          ${userType ? `
            <span class="archetype-emoji">${getArchetypeEmoji(userType)}</span>
            <div class="archetype-name">${userType}</div>
            <p class="archetype-desc">${typeInfo?.description || ''}</p>
          ` : `
            <span class="archetype-emoji">🔍</span>
            <div class="archetype-name">Analyzing...</div>
            <p class="archetype-desc">Log activities for at least 3 days with 3+ entries each to detect your behavioral archetype. The more data you provide, the more accurate the analysis.</p>
          `}
        </div>

        <!-- Key Stats -->
        <div class="profile-stats-grid mb-8">
          <div class="stat-card">
            <div class="stat-label">Avg. Daily Deep Work</div>
            <div class="stat-value" style="color: ${avgStats.avgDeepWork >= 120 ? 'var(--color-success)' : 'var(--color-danger)'};">${formatDuration(avgStats.avgDeepWork)}</div>
            <div class="stat-change">${avgStats.avgDeepWork >= 120 ? 'Above target ✓' : 'Below 2hr target ✗'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg. Sleep</div>
            <div class="stat-value">${formatDuration(avgStats.avgSleep)}</div>
            <div class="stat-change">${avgStats.avgSleep >= 420 ? 'Healthy range ✓' : 'Below 7hr minimum ✗'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Most Wasted On</div>
            <div class="stat-value text-danger" style="font-size: var(--text-lg);">${avgStats.topWaste || 'N/A'}</div>
            <div class="stat-change negative">${avgStats.topWasteTime ? formatDuration(avgStats.topWasteTime) + '/day avg' : 'No data yet'}</div>
          </div>
        </div>

        <!-- Strengths & Weaknesses -->
        <div class="dashboard-grid-full mb-8">
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-success">💪 Strengths</h3>
            <div class="flex-col gap-3">
              ${getStrengths(avgStats).map(s => `
                <div class="flex items-center gap-3 p-3" style="background:var(--color-success-soft); border-radius:var(--radius-md);">
                  <span>✅</span>
                  <span class="text-sm">${s}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-danger">🚩 Weaknesses</h3>
            <div class="flex-col gap-3">
              ${getWeaknesses(avgStats).map(w => `
                <div class="flex items-center gap-3 p-3" style="background:var(--color-danger-soft); border-radius:var(--radius-md);">
                  <span>❌</span>
                  <span class="text-sm">${w}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Fix Suggestions -->
        ${typeInfo ? `
        <div class="glass-card no-hover mb-8">
          <h3 class="font-semibold mb-4">🔧 Personalized Fix Plan for "${userType}"</h3>
          <div class="flex-col gap-3">
            ${typeInfo.fixSuggestions.map((fix, idx) => `
              <div class="flex items-start gap-3 p-4" style="background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid var(--glass-border);">
                <div class="avatar" style="width:28px; height:28px; font-size:12px; flex-shrink:0; background: ${idx === 0 ? 'var(--gradient-danger)' : 'var(--gradient-primary)'};">${idx + 1}</div>
                <div>
                  <div class="text-sm font-semibold">${idx === 0 ? '🔴 Priority #1' : `Step ${idx + 1}`}</div>
                  <div class="text-sm text-secondary mt-1">${fix}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Category Distribution -->
        <div class="glass-card no-hover">
          <h3 class="font-semibold mb-4">📊 Average Daily Time Distribution</h3>
          <div class="flex-col gap-3">
            ${CATEGORIES.map(c => {
              const avgMin = avgStats.categoryAvgs[c.name] || 0;
              const maxMin = Math.max(...Object.values(avgStats.categoryAvgs), 1);
              const percent = Math.round((avgMin / maxMin) * 100);
              return `
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm">${c.icon} ${c.name}</span>
                    <span class="text-xs font-mono text-muted">${formatDuration(avgMin)}/day</span>
                  </div>
                  <div class="progress-bar" style="height:6px;">
                    <div class="progress-bar-fill" style="width:${percent}%; background:${c.color};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function computeAverages() {
    const days = 7;
    const summaries = [];
    for (let i = 0; i < days; i++) {
      const s = collector.getDailySummary(daysAgo(i));
      if (s.logCount > 0) summaries.push(s);
    }

    if (summaries.length === 0) {
      return {
        avgDeepWork: 0, avgSleep: 0, topWaste: null, topWasteTime: 0,
        categoryAvgs: {},
      };
    }

    const categoryAvgs = {};
    CATEGORIES.forEach(c => {
      categoryAvgs[c.name] = Math.round(mean(summaries.map(s => s.categories[c.name]?.minutes || 0)));
    });

    // Find top waste
    const wasteCats = ['Dopamine', 'Fake Rest', 'Avoidance'];
    let topWaste = null, topWasteTime = 0;
    wasteCats.forEach(cat => {
      if (categoryAvgs[cat] > topWasteTime) {
        topWasteTime = categoryAvgs[cat];
        topWaste = cat;
      }
    });

    return {
      avgDeepWork: categoryAvgs['Deep Work'] || 0,
      avgSleep: categoryAvgs['Good Rest'] || 0,
      topWaste,
      topWasteTime,
      categoryAvgs,
    };
  }

  function getStrengths(stats) {
    const strengths = [];
    if (stats.avgDeepWork >= 120) strengths.push('Averaging 2+ hours of deep work daily — solid foundation');
    if (stats.avgSleep >= 420) strengths.push('Healthy sleep duration — your brain is getting recovery time');
    if (stats.categoryAvgs['Good Rest'] >= 30) strengths.push('Including exercise/rest — physical health supports mental performance');
    if (stats.topWasteTime < 60) strengths.push('Low waste time — your discipline is above average');
    if (strengths.length === 0) strengths.push('Keep logging data — strengths will be identified with more entries');
    return strengths;
  }

  function getWeaknesses(stats) {
    const weaknesses = [];
    if (stats.avgDeepWork < 120) weaknesses.push(`Deep work is only ${formatDuration(stats.avgDeepWork)}/day — target is 2+ hours minimum`);
    if (stats.avgSleep < 420 && stats.avgSleep > 0) weaknesses.push(`Sleep averaging ${formatDuration(stats.avgSleep)} — below the 7-hour cognitive health minimum`);
    if (stats.topWasteTime >= 120) weaknesses.push(`${stats.topWaste} consuming ${formatDuration(stats.topWasteTime)}/day — major time drain`);
    if (stats.categoryAvgs['Fake Rest'] >= 60) weaknesses.push(`${formatDuration(stats.categoryAvgs['Fake Rest'])}/day of fake rest — neither productive nor restful`);
    if (stats.categoryAvgs['Avoidance'] >= 60) weaknesses.push(`${formatDuration(stats.categoryAvgs['Avoidance'])}/day in avoidance — overthinking replaces action`);
    if (weaknesses.length === 0) weaknesses.push('More data needed to identify areas for improvement');
    return weaknesses;
  }

  function getArchetypeEmoji(type) {
    const emojis = {
      'Dopamine Addict': '🎰',
      'Night Waster': '🌙',
      'Overthinker': '🧠',
      'Busy but Unproductive': '📋',
      'Inconsistent Performer': '🎢',
      'Sleep-Deprived Warrior': '😴',
    };
    return emojis[type] || '🔍';
  }

  function mount() {}

  return { render, mount };
}

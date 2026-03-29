// ============================================
// STD TIME TRACKER — Insights Page
// ============================================

import { state } from '../core/state.js';
import { today, daysAgo, formatDuration, mean } from '../core/utils.js';
import { analyzer } from '../agents/analyzer.js';
import { collector } from '../agents/collector.js';
import { planner } from '../agents/planner.js';
import { CATEGORIES } from '../data/categories.js';
import { INSIGHTS } from '../data/insights-bank.js';

export function InsightsPage() {
  function render() {
    const todayAnalysis = analyzer.analyzeDay(today());
    const userType = analyzer.classifyUserType();
    const habitSuggestions = planner.suggestHabitChanges();
    const whatIfs = generateWhatIfs();

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Insights</h1>
          <p>Brutally honest, data-driven analysis of your behavior. No sugar-coating.</p>
        </div>

        <!-- Today's Insights -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🧠 TODAY'S ANALYSIS</h3>
          ${todayAnalysis.insights.length > 0 ? `
            <div class="flex-col gap-4">
              ${todayAnalysis.insights.map(insight => `
                <div class="insight-card glass-card no-hover" style="border-left-color: ${getCatColor(insight.category)};">
                  <div class="insight-category" style="color: ${getCatColor(insight.category)};">${insight.category}</div>
                  <div class="insight-text">${insight.text}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center text-muted p-8">
              <p class="text-lg mb-2">📊</p>
              <p>Log today's activities to generate insights.</p>
            </div>
          `}
        </div>

        <!-- What If Calculator -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--color-warning);">💡 "WHAT IF" CALCULATOR</h3>
          <p class="text-sm text-secondary mb-4">See the compound effect of small changes over time.</p>
          <div class="flex-col gap-4">
            ${whatIfs.map(wi => `
              <div class="what-if-card">
                <div class="what-if-result">
                  <div>
                    <div class="text-xs text-muted mb-1">Currently</div>
                    <div class="text-lg font-bold text-danger">${wi.current}</div>
                  </div>
                  <div class="what-if-arrow">→</div>
                  <div>
                    <div class="text-xs text-muted mb-1">If you changed</div>
                    <div class="text-lg font-bold text-success">${wi.result}</div>
                  </div>
                </div>
                <p class="text-sm text-secondary mt-3">${wi.explanation}</p>
              </div>
            `).join('')}
            ${whatIfs.length === 0 ? '<p class="text-center text-muted p-4">Need more data to generate "What If" scenarios. Log for 3+ days.</p>' : ''}
          </div>
        </div>

        <!-- Pattern Alerts -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🔍 DETECTED PATTERNS</h3>
          <div class="flex-col gap-3">
            ${getPatternAlerts().map(alert => `
              <div class="p-4 flex items-start gap-3" style="background: ${alert.type === 'warning' ? 'var(--color-danger-soft)' : alert.type === 'tip' ? 'var(--color-success-soft)' : 'var(--color-info-soft)'}; border-radius: var(--radius-md);">
                <span class="text-lg">${alert.icon}</span>
                <div>
                  <div class="text-sm font-semibold">${alert.title}</div>
                  <div class="text-sm text-secondary mt-1">${alert.message}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- User Type Deep Dive -->
        ${userType ? `
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-primary);">🎭 ABOUT YOUR TYPE: ${userType.toUpperCase()}</h3>
          <div class="p-4" style="background:rgba(124,58,237,0.06); border-radius:var(--radius-md); border:1px solid rgba(124,58,237,0.15);">
            <p class="text-sm" style="line-height:1.8;">${INSIGHTS.userTypes[userType]?.description || ''}</p>
          </div>
          ${INSIGHTS.userTypes[userType]?.fixSuggestions ? `
            <div class="mt-4">
              <h4 class="text-sm font-semibold mb-3">🔧 Your Action Plan:</h4>
              <div class="flex-col gap-2">
                ${INSIGHTS.userTypes[userType].fixSuggestions.map((s, i) => `
                  <div class="flex items-center gap-3 text-sm">
                    <div class="avatar" style="width:24px;height:24px;font-size:11px;flex-shrink:0;">${i + 1}</div>
                    <span>${s}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Motivational -->
        <div class="glass-card no-hover text-center" style="border: 1px solid rgba(16,185,129,0.2); background: rgba(16,185,129,0.03);">
          <p class="text-lg font-semibold mb-2">💪 Remember</p>
          <p class="text-secondary">${getMotivationalQuote()}</p>
        </div>
      </div>
    `;
  }

  function generateWhatIfs() {
    const whatIfs = [];
    const days = 7;
    let totalDopamine = 0, totalFakeRest = 0, totalDeepWork = 0, count = 0;

    for (let i = 0; i < days; i++) {
      const s = collector.getDailySummary(daysAgo(i));
      if (s.logCount > 0) {
        totalDopamine += s.categories['Dopamine']?.minutes || 0;
        totalFakeRest += s.categories['Fake Rest']?.minutes || 0;
        totalDeepWork += s.categories['Deep Work']?.minutes || 0;
        count++;
      }
    }

    if (count < 3) return whatIfs;

    const avgDopamine = totalDopamine / count;
    const avgFakeRest = totalFakeRest / count;
    const avgDeepWork = totalDeepWork / count;

    if (avgDopamine >= 60) {
      const halfDopamine = Math.round(avgDopamine / 2);
      whatIfs.push({
        current: `${formatDuration(avgDopamine)}/day on phone`,
        result: `+${formatDuration(halfDopamine * 30)} study time/month`,
        explanation: `If you cut your daily phone time in half (${formatDuration(avgDopamine)} → ${formatDuration(halfDopamine)}), you'd gain ${formatDuration(halfDopamine * 30)} of potential study time per month. That's enough to complete an entire course.`,
      });
    }

    if (avgFakeRest >= 30) {
      whatIfs.push({
        current: `${formatDuration(avgFakeRest)}/day of fake rest`,
        result: `${formatDuration(avgFakeRest * 30)} reclaimed/month`,
        explanation: `Replacing "lying in bed with phone" with actual rest (nap, walk, meditation) would give you ${formatDuration(avgFakeRest * 30)} of quality recovery time per month, dramatically improving your afternoon productivity.`,
      });
    }

    if (avgDeepWork < 120) {
      const target = 180;
      const diff = target - avgDeepWork;
      whatIfs.push({
        current: `${formatDuration(avgDeepWork)}/day deep work`,
        result: `${formatDuration(diff * 365)} more productive time/year`,
        explanation: `Adding just ${formatDuration(diff)} more deep work daily would give you ${formatDuration(diff * 365)} extra hours per year. That's the difference between average and exceptional.`,
      });
    }

    return whatIfs;
  }

  function getPatternAlerts() {
    const alerts = [];
    const todayAnalysis = analyzer.analyzeDay(today());

    if (todayAnalysis.patterns.weakestTimeSlot) {
      alerts.push({
        icon: '⚠️',
        type: 'warning',
        title: `Weak Zone: ${todayAnalysis.patterns.weakestTimeSlot}`,
        message: 'This time slot has the highest waste-to-productive ratio. Consider scheduling deep work or exercise here instead.',
      });
    }

    if (todayAnalysis.patterns.triggers.length > 0) {
      const t = todayAnalysis.patterns.triggers[0];
      alerts.push({
        icon: '🔍',
        type: 'warning',
        title: 'Behavioral Trigger Detected',
        message: `After "${t.trigger}", you tend to switch to "${t.response}". Break this pattern by planning a different follow-up activity.`,
      });
    }

    if (todayAnalysis.patterns.productiveSlots.length > 0) {
      const best = todayAnalysis.patterns.productiveSlots[0];
      alerts.push({
        icon: '✅',
        type: 'tip',
        title: `Peak Zone: ${best.name}`,
        message: `You're most productive during ${best.name} (${formatDuration(best.minutes)} today). Protect this time — no meetings, no phone, no interruptions.`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        icon: '📊',
        type: 'info',
        title: 'Gathering Data',
        message: 'Log more activities to unlock pattern detection. The system gets smarter with every entry.',
      });
    }

    return alerts;
  }

  function getCatColor(category) {
    const colors = {
      'Dopamine': '#ef4444',
      'Fake Rest': '#f97316',
      'Avoidance': '#f59e0b',
      'Productivity': '#10b981',
      'Pattern': '#3b82f6',
      'Trigger': '#ec4899',
    };
    return colors[category] || '#7c3aed';
  }

  function getMotivationalQuote() {
    const quotes = [
      "Discipline is choosing between what you want now and what you want most.",
      "The pain of discipline is nothing compared to the pain of regret.",
      "You don't rise to the level of your goals. You fall to the level of your systems.",
      "Small daily improvements over time lead to stunning results.",
      "The best time to plant a tree was 20 years ago. The second best time is now.",
      "Don't count the days. Make the days count.",
      "Success is not the key to consistency. Consistency is the key to success.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  function mount() {}

  return { render, mount };
}

// ============================================
// STD TIME TRACKER — Insights Page (v2.0 + AI)
// ============================================

import { state } from '../core/state.js';
import { api } from '../core/api.js';
import { today, daysAgo, formatDuration, mean } from '../core/utils.js';
import { analyzer } from '../agents/analyzer.js';
import { collector } from '../agents/collector.js';
import { planner } from '../agents/planner.js';
import { CATEGORIES } from '../data/categories.js';
import { INSIGHTS } from '../data/insights-bank.js';

export function InsightsPage() {
  let aiAnalysis = null;
  let aiLoading = false;
  let coaching = null;

  function render() {
    const todayAnalysis = analyzer.analyzeDay(today());
    const userType = analyzer.classifyUserType();
    const whatIfs = generateWhatIfs();
    const backendOnline = window.__timeforge_backend;
    const aiReady = window.__timeforge_ai;

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Insights</h1>
          <p>Brutally honest, data-driven analysis of your behavior. No sugar-coating.</p>
        </div>

        <!-- AI Deep Analysis Section -->
        ${backendOnline && api.isAuthenticated ? `
        <div class="glass-card no-hover mb-6" style="border: 1px solid rgba(124,58,237,0.3); position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg, #7c3aed, #06b6d4, #7c3aed); background-size: 200% 100%; animation: shimmer 3s linear infinite;"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-primary);">
              🤖 AI DEEP ANALYSIS
              <span class="badge badge-sm" style="background:rgba(124,58,237,0.15); color:var(--accent-primary); font-size:9px; margin-left:8px;">GEMINI</span>
            </h3>
            <button id="ai-refresh-btn" class="btn btn-sm btn-ghost" style="font-size:12px;">
              ${aiLoading ? '⏳ Analyzing...' : '🔄 Refresh'}
            </button>
          </div>

          <div id="ai-analysis-container">
            ${aiAnalysis ? renderAIAnalysis(aiAnalysis) : (aiReady ? `
              <div class="text-center p-6">
                <p class="text-lg mb-2">🧠</p>
                <p class="text-sm text-secondary mb-4">Click "Refresh" to run AI behavioral analysis on your last 7 days of data.</p>
                <p class="text-xs text-muted">Powered by Google Gemini • Cached for 6 hours</p>
              </div>
            ` : `
              <div class="text-center p-6">
                <p class="text-lg mb-2">🔑</p>
                <p class="text-sm text-secondary">AI not configured. Add your Gemini API key to <code>backend/.env</code></p>
                <p class="text-xs text-muted mt-2">Get a free key at aistudio.google.com</p>
              </div>
            `)}
          </div>
        </div>
        ` : ''}

        <!-- AI Coaching Message -->
        ${coaching ? `
        <div class="glass-card no-hover mb-6" style="border-left: 3px solid ${coaching.tone === 'tough_love' ? '#ef4444' : coaching.tone === 'warning' ? '#f59e0b' : '#10b981'};">
          <div class="flex items-start gap-3">
            <span class="text-2xl">${coaching.emoji || '💬'}</span>
            <div>
              <div class="text-xs text-muted mb-1 uppercase">${coaching.tone === 'tough_love' ? 'Tough Love' : coaching.tone === 'warning' ? 'Warning' : coaching.tone === 'celebrating' ? 'Celebration' : 'Encouragement'} • AI Coach</div>
              <p class="text-sm" style="line-height: 1.7;">${coaching.message}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Today's Rule-Based Insights -->
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

        <!-- AI What-If Calculator -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--color-warning);">💡 "WHAT IF" CALCULATOR</h3>
          <p class="text-sm text-secondary mb-4">See the compound effect of small changes over time.</p>

          ${backendOnline && api.isAuthenticated ? `
          <div class="flex gap-2 mb-4">
            <input type="text" id="whatif-input" class="form-input" placeholder="What if I stopped using Instagram after 9 PM?" style="flex:1;">
            <button id="whatif-ai-btn" class="btn btn-sm" style="background:rgba(124,58,237,0.15); color:var(--accent-primary); white-space:nowrap;">🤖 Ask AI</button>
          </div>
          <div id="whatif-ai-result" class="mb-4"></div>
          ` : ''}

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

  function renderAIAnalysis(data) {
    return `
      <div class="flex-col gap-4">
        <!-- Severity Banner -->
        <div class="p-3 text-center" style="background: ${data.severity === 'critical' ? 'rgba(239,68,68,0.1)' : data.severity === 'moderate' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'}; border-radius: var(--radius-md); border: 1px solid ${data.severity === 'critical' ? 'rgba(239,68,68,0.2)' : data.severity === 'moderate' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'};">
          <span class="text-xs font-semibold uppercase" style="color: ${data.severity === 'critical' ? '#ef4444' : data.severity === 'moderate' ? '#f59e0b' : '#10b981'};">
            ${data.severity === 'critical' ? '🔴 CRITICAL' : data.severity === 'moderate' ? '🟡 MODERATE' : '🟢 MILD'} — AI Behavioral Assessment
          </span>
        </div>

        <!-- Brutal Message -->
        ${data.brutally_honest_message ? `
        <div class="p-4" style="background:rgba(124,58,237,0.06); border-radius: var(--radius-md); border-left: 3px solid var(--accent-primary);">
          <p class="text-sm" style="line-height: 1.8;">${data.brutally_honest_message}</p>
        </div>
        ` : ''}

        <!-- Scores -->
        ${data.discipline_score !== undefined ? `
        <div class="grid grid-3 gap-3">
          <div class="text-center p-3" style="background:rgba(255,255,255,0.02); border-radius:var(--radius-md);">
            <div class="text-2xl font-bold" style="color:${data.discipline_score >= 60 ? '#10b981' : '#ef4444'}">${data.discipline_score}</div>
            <div class="text-xs text-muted mt-1">Discipline</div>
          </div>
          <div class="text-center p-3" style="background:rgba(255,255,255,0.02); border-radius:var(--radius-md);">
            <div class="text-2xl font-bold" style="color:${data.consistency_score >= 60 ? '#10b981' : '#ef4444'}">${data.consistency_score}</div>
            <div class="text-xs text-muted mt-1">Consistency</div>
          </div>
          <div class="text-center p-3" style="background:rgba(255,255,255,0.02); border-radius:var(--radius-md);">
            <div class="text-2xl font-bold" style="color:${(data.phone_addiction_score || 0) <= 40 ? '#10b981' : '#ef4444'}">${data.phone_addiction_score || 0}</div>
            <div class="text-xs text-muted mt-1">Phone Addiction</div>
          </div>
        </div>
        ` : ''}

        <!-- Key Findings -->
        <div class="grid grid-2 gap-3">
          ${data.biggest_problem ? `
          <div class="p-3" style="background:rgba(239,68,68,0.06); border-radius:var(--radius-md);">
            <div class="text-xs text-muted mb-1">🎯 Biggest Problem</div>
            <div class="text-sm">${data.biggest_problem}</div>
          </div>
          ` : ''}
          ${data.weak_time_slot ? `
          <div class="p-3" style="background:rgba(245,158,11,0.06); border-radius:var(--radius-md);">
            <div class="text-xs text-muted mb-1">⏰ Weakest Time Slot</div>
            <div class="text-sm">${data.weak_time_slot}</div>
          </div>
          ` : ''}
          ${data.root_cause ? `
          <div class="p-3" style="background:rgba(124,58,237,0.06); border-radius:var(--radius-md);">
            <div class="text-xs text-muted mb-1">🧠 Root Cause</div>
            <div class="text-sm">${data.root_cause}</div>
          </div>
          ` : ''}
          ${data.behavioral_pattern ? `
          <div class="p-3" style="background:rgba(59,130,246,0.06); border-radius:var(--radius-md);">
            <div class="text-xs text-muted mb-1">🔄 Pattern</div>
            <div class="text-sm">${data.behavioral_pattern}</div>
          </div>
          ` : ''}
        </div>

        <!-- Action Items -->
        ${data.suggestions && data.suggestions.length > 0 ? `
        <div>
          <div class="text-xs text-muted mb-2 uppercase">🔧 AI Suggestions</div>
          <div class="flex-col gap-2">
            ${data.suggestions.map((s, i) => `
              <div class="flex items-start gap-3 p-3 text-sm" style="background:rgba(16,185,129,0.04); border-radius:var(--radius-md);">
                <div class="avatar" style="width:22px;height:22px;font-size:10px;flex-shrink:0;background:rgba(16,185,129,0.15);color:#10b981;">${i+1}</div>
                <span>${s}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Today's Fix -->
        ${data.daily_fix ? `
        <div class="p-4 text-center" style="background:rgba(16,185,129,0.08); border-radius:var(--radius-md); border:1px solid rgba(16,185,129,0.2);">
          <div class="text-xs text-muted mb-1">⚡ TODAY'S ONE THING</div>
          <div class="text-sm font-semibold" style="color:#10b981;">${data.daily_fix}</div>
        </div>
        ` : ''}

        <div class="text-center text-xs text-muted mt-2">
          Analysis source: AI (Gemini) • User type: ${data.user_type || 'Analyzing...'}
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
        explanation: `If you cut your daily phone time in half (${formatDuration(avgDopamine)} → ${formatDuration(halfDopamine)}), you'd gain ${formatDuration(halfDopamine * 30)} of potential study time per month.`,
      });
    }

    if (avgFakeRest >= 30) {
      whatIfs.push({
        current: `${formatDuration(avgFakeRest)}/day of fake rest`,
        result: `${formatDuration(avgFakeRest * 30)} reclaimed/month`,
        explanation: `Replacing "lying in bed with phone" with actual rest (nap, walk, meditation) would give you ${formatDuration(avgFakeRest * 30)} of quality recovery time per month.`,
      });
    }

    if (avgDeepWork < 120) {
      const target = 180;
      const diff = target - avgDeepWork;
      whatIfs.push({
        current: `${formatDuration(avgDeepWork)}/day deep work`,
        result: `${formatDuration(diff * 365)} more productive time/year`,
        explanation: `Adding just ${formatDuration(diff)} more deep work daily would give you ${formatDuration(diff * 365)} extra hours per year.`,
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
        message: `You're most productive during ${best.name} (${formatDuration(best.minutes)} today). Protect this time.`,
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
      "Don't count the days. Make the days count.",
      "Success is not the key to consistency. Consistency is the key to success.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  function mount() {
    // AI Refresh button
    const refreshBtn = document.getElementById('ai-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        if (aiLoading) return;
        aiLoading = true;
        refreshBtn.textContent = '⏳ Analyzing...';
        refreshBtn.disabled = true;

        try {
          const result = await api.getAIAnalysis(7);
          if (result.analysis) {
            aiAnalysis = result.analysis;
            const container = document.getElementById('ai-analysis-container');
            if (container) container.innerHTML = renderAIAnalysis(aiAnalysis);
          } else {
            const container = document.getElementById('ai-analysis-container');
            if (container) container.innerHTML = `<p class="text-center text-muted p-4">${result.message || 'No analysis available.'}</p>`;
          }
        } catch (e) {
          const container = document.getElementById('ai-analysis-container');
          if (container) container.innerHTML = `<p class="text-center text-danger p-4">${e.message}</p>`;
        }

        aiLoading = false;
        refreshBtn.textContent = '🔄 Refresh';
        refreshBtn.disabled = false;
      });
    }

    // AI What-If
    const whatifBtn = document.getElementById('whatif-ai-btn');
    const whatifInput = document.getElementById('whatif-input');
    if (whatifBtn && whatifInput) {
      whatifBtn.addEventListener('click', async () => {
        const scenario = whatifInput.value.trim();
        if (!scenario) return;

        const resultEl = document.getElementById('whatif-ai-result');
        resultEl.innerHTML = '<p class="text-center text-muted p-3">🤖 Analyzing scenario...</p>';

        try {
          const result = await api.whatIfAnalysis(scenario);
          if (result.time_saved_daily !== undefined) {
            resultEl.innerHTML = `
              <div class="glass-card no-hover" style="border-left: 3px solid var(--accent-primary);">
                <div class="what-if-result mb-3">
                  <div>
                    <div class="text-xs text-muted mb-1">If you continue</div>
                    <div class="text-sm text-danger">${result.current_state || ''}</div>
                  </div>
                  <div class="what-if-arrow">→</div>
                  <div>
                    <div class="text-xs text-muted mb-1">With this change</div>
                    <div class="text-sm text-success">${result.improved_state || ''}</div>
                  </div>
                </div>
                <p class="text-sm text-secondary">${result.impact_description || ''}</p>
                ${result.first_step ? `<p class="text-sm mt-2" style="color:var(--accent-primary);">⚡ First step: ${result.first_step}</p>` : ''}
                <div class="text-xs text-muted mt-2">Saves: ${result.time_saved_daily}min/day • ${result.time_saved_weekly}min/week • ${result.time_saved_monthly}min/month</div>
              </div>
            `;
          } else {
            resultEl.innerHTML = `<p class="text-center text-muted p-3">${result.message || 'Could not analyze this scenario.'}</p>`;
          }
        } catch (e) {
          resultEl.innerHTML = `<p class="text-center text-danger p-3">${e.message}</p>`;
        }
      });

      // Enter key support
      whatifInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') whatifBtn.click();
      });
    }

    // Load coaching message on mount (non-blocking)
    if (window.__timeforge_backend && api.isAuthenticated) {
      api.getCoaching().then(result => {
        if (result && result.message) {
          coaching = result;
          // Re-render just the coaching section would be complex, so we note it for next visit
        }
      }).catch(() => {});
    }
  }

  return { render, mount };
}

// ============================================
// STD TIME TRACKER — Enforcer Page
// ============================================

import { state } from '../core/state.js';
import { today, formatDate, formatDuration, formatTime, daysAgo, getComplianceClass, getComplianceColor } from '../core/utils.js';
import { enforcer } from '../agents/enforcer.js';
import { collector } from '../agents/collector.js';
import { showToast } from '../components/toast.js';
import { LineChart } from '../components/charts.js';

export function EnforcerPage() {
  function render() {
    const todayDate = today();
    const feedback = enforcer.generateFeedback(todayDate);
    const compliance = enforcer.calculateCompliance(todayDate);
    const patterns = enforcer.detectLazinessPatterns();
    const adjustments = enforcer.suggestNextDayAdjustments();
    const weekHistory = enforcer.getWeeklyComplianceHistory();

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Enforcer</h1>
          <p>Your strict accountability system. No excuses, no shortcuts.</p>
        </div>

        <!-- Compliance Hero -->
        <div class="glass-card no-hover compliance-hero mb-8">
          <div class="compliance-score ${getComplianceClass(feedback.score)}">
            ${feedback.score}
          </div>
          <div class="text-secondary text-sm mb-4">Today's Compliance Score</div>
          <div class="feedback-message glass-card no-hover" style="display:inline-block; max-width:600px; border-left: 3px solid ${getComplianceColor(feedback.score)};">
            ${feedback.message}
          </div>
        </div>

        <!-- Week Compliance Chart -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📊 7-DAY COMPLIANCE TREND</h3>
          <div class="chart-container" style="height:200px;">
            <canvas id="chart-compliance-week"></canvas>
          </div>
          <div class="flex gap-2 mt-4 justify-center">
            ${weekHistory.map(d => `
              <div class="p-2 text-center" style="background:var(--glass-bg); border-radius:var(--radius-md); min-width:60px; border: 1px solid ${d.date === todayDate ? 'var(--accent-primary)' : 'var(--glass-border)'};">
                <div class="text-xs text-muted">${formatDate(d.date).split(',')[0]}</div>
                <div class="font-mono font-bold text-sm" style="color: ${getComplianceColor(d.score)};">${d.hasData ? d.score + '%' : '—'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="dashboard-grid-full mb-6">
          <!-- Deviations -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">❌ DEVIATIONS</h3>
            ${feedback.deviations.length > 0 ? `
              <div class="deviation-list">
                ${feedback.deviations.map(d => `
                  <div class="deviation-item">
                    <div>
                      <div class="text-xs text-muted">Planned</div>
                      <div class="text-sm font-semibold">${d.planned}</div>
                    </div>
                    <div class="deviation-arrow">→</div>
                    <div>
                      <div class="text-xs text-muted">Actual</div>
                      <div class="text-sm font-semibold text-danger">${d.actual}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center text-muted p-6">
                ${compliance.hasPlan ? 'No deviations detected. Excellent! 🎯' : 'Generate a plan first to track deviations.'}
              </div>
            `}
          </div>

          <!-- Laziness Patterns -->
          <div class="glass-card no-hover">
            <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🚩 LAZINESS PATTERNS</h3>
            ${patterns.length > 0 ? `
              <div class="flex-col gap-3">
                ${patterns.map(p => `
                  <div class="p-3" style="background:${p.severity === 'high' ? 'var(--color-danger-soft)' : 'var(--color-warning-soft)'}; border-radius:var(--radius-md);">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="badge ${p.severity === 'high' ? 'badge-danger' : 'badge-warning'}" style="font-size:10px;">${p.severity}</span>
                      <span class="text-xs text-muted">${p.type.replace(/_/g, ' ')}</span>
                    </div>
                    <div class="text-sm">${p.message}</div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center text-muted p-6">
                No concerning patterns detected yet. Keep logging consistently.
              </div>
            `}
          </div>
        </div>

        <!-- Next Day Adjustments -->
        ${adjustments.length > 0 ? `
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🔧 TOMORROW'S ADJUSTMENTS</h3>
          <div class="flex-col gap-3">
            ${adjustments.map(a => `
              <div class="flex items-start gap-3 p-4" style="background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid var(--glass-border);">
                <span class="text-lg">${a.type === 'recovery' ? '🔄' : a.type === 'increase' ? '📈' : '📱'}</span>
                <div class="text-sm">${a.message}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Process End of Day -->
        <div class="glass-card no-hover text-center">
          <h3 class="font-semibold mb-2">🏁 End of Day Processing</h3>
          <p class="text-sm text-secondary mb-4">Calculate XP, update streaks, and check achievements for today.</p>
          <button class="btn btn-primary btn-lg" id="process-eod-btn">Process Today's Results</button>
        </div>
      </div>
    `;
  }

  function mount() {
    // Compliance line chart
    const canvas = document.getElementById('chart-compliance-week');
    if (canvas) {
      const weekHistory = enforcer.getWeeklyComplianceHistory();
      const lineData = weekHistory.map(d => ({
        label: formatDate(d.date).split(',')[0],
        value: d.hasData ? d.score : 0,
      }));

      const rect = canvas.parentElement.getBoundingClientRect();
      const chart = new LineChart(canvas, {
        data: lineData,
        width: Math.min(rect.width - 20, 600),
        height: 180,
        lineColor: '#7c3aed',
      });
      chart.draw();
    }

    // EOD button
    const eodBtn = document.getElementById('process-eod-btn');
    if (eodBtn) {
      eodBtn.addEventListener('click', () => {
        const result = enforcer.processEndOfDay();
        showToast('success', 'Day Processed! 🏁', `Compliance: ${result.score}% · Streaks and XP updated`);
        
        // Refresh page
        const container = document.getElementById('app-content');
        if (container) {
          const page = EnforcerPage();
          container.innerHTML = page.render();
          page.mount();
        }
      });
    }
  }

  return { render, mount };
}

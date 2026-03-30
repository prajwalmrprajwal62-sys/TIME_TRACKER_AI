// ============================================
// STD TIME TRACKER — Planner Page
// ============================================

import { state } from '../core/state.js';
import { today, formatDate, formatTime, formatDuration, getWeekDates, getDayName } from '../core/utils.js';
import { planner } from '../agents/planner.js';
import { collector } from '../agents/collector.js';
import { analyzer } from '../agents/analyzer.js';
import { getCategoryByName, CATEGORIES } from '../data/categories.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';

export function PlannerPage() {
  function render() {
    const todayDate = today();
    const currentPlan = state.get('plans')?.[todayDate] || [];
    const recoverable = planner.getRecoverableTime();
    const habits = planner.suggestHabitChanges();
    const weekDates = getWeekDates();
    const energyProfile = analyzer.getEnergyProfile();

    // Energy bar color helper
    const energyColor = (level) => level === 'peak' ? 'var(--color-success)' : level === 'moderate' ? 'var(--color-warning)' : 'var(--color-danger)';
    const energyBarWidth = (avg) => Math.round((avg / 5) * 100);

    return `
      <div class="page-container stagger-children">
        <div class="page-header flex justify-between items-center">
          <div>
            <h1>Daily Planner</h1>
            <p>Your optimized schedule based on behavioral data and goals.</p>
          </div>
          <div class="flex gap-2">
            ${api.isAuthenticated && api.isOnline ? `
              <button class="btn btn-secondary" id="ai-plan-btn">
                🤖 AI Plan
              </button>
            ` : ''}
            <button class="btn btn-primary" id="gen-plan-btn">
              ⚡ Generate Today's Plan
            </button>
          </div>
        </div>

        <!-- Recoverable Time -->
        ${recoverable.items.length > 0 ? `
        <div class="glass-card no-hover mb-6" style="border-left: 3px solid var(--color-success);">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-sm" style="color: var(--color-success);">♻️ RECOVERABLE TIME</h3>
            <span class="badge badge-success font-mono">${formatDuration(recoverable.totalRecoverable)} available</span>
          </div>
          <div class="flex-col gap-2">
            ${recoverable.items.map(r => `
              <div class="flex items-center justify-between p-3" style="background:var(--glass-bg); border-radius:var(--radius-md);">
                <div>
                  <span class="text-sm font-semibold">${getCategoryByName(r.category)?.icon || ''} ${r.category}</span>
                  <span class="text-xs text-muted ml-2">currently ${formatDuration(r.currentMinutes)}/day</span>
                </div>
                <div class="text-xs text-success">→ Recover ${formatDuration(r.recoverableMinutes)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Energy Profile -->
        <div class="glass-card no-hover mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">⚡ YOUR ENERGY PROFILE</h3>
            ${energyProfile.hasData ? `
              <span class="text-xs text-muted">Peak: ${energyProfile.peakSlot.emoji} ${energyProfile.peakSlot.name}</span>
            ` : `<span class="text-xs text-muted">Log more activities to build your profile</span>`}
          </div>
          <div class="flex-col gap-3">
            ${energyProfile.slots.map(slot => `
              <div class="energy-slot-row">
                <div class="energy-slot-label">
                  <span class="energy-slot-emoji">${slot.emoji}</span>
                  <span class="energy-slot-name">${slot.name}</span>
                </div>
                <div class="energy-bar-container">
                  <div class="energy-bar" style="width:${energyBarWidth(slot.avgEnergy)}%; background:${energyColor(slot.level)};"></div>
                </div>
                <div class="energy-slot-meta">
                  <span class="energy-level-badge energy-${slot.level}">${slot.level}</span>
                </div>
              </div>
            `).join('')}
          </div>
          ${energyProfile.hasData ? `
            <div class="mt-4 p-3" style="background:rgba(124,58,237,0.06); border-radius:var(--radius-md); border:1px solid rgba(124,58,237,0.15);">
              <div class="text-xs font-semibold" style="color:var(--accent-primary-light);">💡 Scheduling Tip</div>
              <div class="text-xs text-secondary mt-1">
                Schedule Deep Work during <strong>${energyProfile.peakSlot.name}</strong> (${energyProfile.peakSlot.emoji}) and routine tasks during <strong>${energyProfile.dipSlot.name}</strong> (${energyProfile.dipSlot.emoji}).
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Week Overview -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📅 WEEK OVERVIEW</h3>
          <div class="grid" style="grid-template-columns: repeat(7, 1fr); gap: var(--space-3);">
            ${weekDates.map(date => {
              const isToday = date === todayDate;
              const hasPlan = (state.get('plans')?.[date] || []).length > 0;
              const summary = collector.getDailySummary(date);
              return `
                <div class="p-3 text-center" style="background:${isToday ? 'rgba(124,58,237,0.1)' : 'var(--glass-bg)'}; border-radius:var(--radius-md); border:${isToday ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'};">
                  <div class="text-xs font-semibold ${isToday ? '' : 'text-muted'}">${getDayName(date)}</div>
                  <div class="text-xs text-muted font-mono mt-1">${date.slice(8)}</div>
                  ${hasPlan ? '<div class="text-xs mt-1" style="color:var(--color-success);">📋</div>' : ''}
                  ${summary.logCount > 0 ? `<div class="text-xs mt-1 font-mono" style="color:var(--color-success);">${formatDuration(summary.productiveMinutes)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Today's Plan -->
        <div class="glass-card no-hover mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📋 TODAY'S PLAN — ${formatDate(todayDate)}</h3>
            ${currentPlan.length > 0 ? `<span class="badge badge-info">${currentPlan.length} blocks</span>` : ''}
          </div>
          
          ${currentPlan.length > 0 ? `
            <div class="plan-timeline">
              ${currentPlan.map(block => {
                const cat = getCategoryByName(block.category);
                return `
                  <div class="plan-block">
                    <div class="plan-time">${formatTime(block.startTime)}</div>
                    <div class="plan-activity" style="border-left-color: ${cat?.color || '#6b7280'};">
                      <div class="plan-title">${block.activity}</div>
                      <div class="flex items-center gap-3">
                        <span class="plan-duration">${formatDuration(block.duration)}</span>
                        <span class="badge badge-${block.category.toLowerCase().replace(/\s+/g, '-')}" style="font-size:10px;">${block.category}</span>
                        ${block.priority === 'high' ? '<span class="badge badge-warning" style="font-size:10px;">Priority</span>' : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="empty-state" style="padding: var(--space-8);">
              <div class="empty-icon">📋</div>
              <h3>No plan generated yet</h3>
              <p>Click "Generate Today's Plan" to create a personalized schedule based on your data and goals.</p>
            </div>
          `}
        </div>

        <!-- Habit Changes -->
        ${habits.length > 0 ? `
        <div class="glass-card no-hover">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🔄 SUGGESTED HABIT CHANGES</h3>
          <div class="flex-col gap-3">
            ${habits.map(h => `
              <div class="p-4" style="background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid var(--glass-border); border-left: 3px solid ${h.priority === 'high' ? 'var(--color-danger)' : 'var(--accent-primary)'};">
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge ${h.priority === 'high' ? 'badge-danger' : 'badge-info'}" style="font-size:10px;">${h.priority}</span>
                  <span class="font-semibold text-sm">${h.title}</span>
                </div>
                <p class="text-sm text-secondary">${h.action}</p>
                <p class="text-xs text-muted mt-1">Impact: ${h.impact}</p>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  function mount() {
    // Hydrate weekly plans from backend (source of truth)
    if (api.isAuthenticated && api.isOnline) {
      api.getPlans().then(backendPlans => {
        if (backendPlans && Array.isArray(backendPlans)) {
          let updated = false;
          const plans = state.get('plans') || {};
          
          backendPlans.forEach(bp => {
            if (bp.date && bp.plan_json) {
              try {
                const blocks = JSON.parse(bp.plan_json);
                if (Array.isArray(blocks) && blocks.length > 0) {
                  // Only update if local is missing or we want to force strict sync
                  if (!plans[bp.date]) {
                    plans[bp.date] = blocks;
                    updated = true;
                  }
                }
              } catch (e) {}
            }
          });

          if (updated) {
            state.set('plans', plans);
            const todayDate = today();
            if (plans[todayDate]) {
              refreshPage();
            }
          }
        }
      }).catch(e => console.warn('Weekly plans hydration failed:', e.message));
    }

    const genBtn = document.getElementById('gen-plan-btn');
    if (genBtn) {
      genBtn.addEventListener('click', () => {
        const plan = planner.generateDailyPlan();
        if (plan) {
          // Sync to backend
          api.writeWithFallback('/plans', 'POST', {
            date: today(),
            plan_json: JSON.stringify(plan),
            generated_by: 'rule',
          }, `Plan: ${today()}`);

          showToast('success', 'Plan Generated! 📋', `${plan.length} blocks created for today`);
          refreshPage();
        }
      });
    }

    // AI Plan button
    const aiBtn = document.getElementById('ai-plan-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', async () => {
        aiBtn.disabled = true;
        aiBtn.textContent = '⏳ Generating...';
        try {
          const result = await api.safeAICall(() => api.generateAIPlan());
          if (result && !result.error && result.plan) {
            const planBlocks = result.plan;
            // Save to state
            const plans = state.get('plans') || {};
            plans[today()] = planBlocks;
            state.set('plans', plans);

            showToast('success', '🤖 AI Plan Generated!', `${planBlocks.length} blocks based on your patterns`);
            refreshPage();
          } else {
            showToast('warning', 'AI plan unavailable', result.message || 'Using rule-based plan instead');
            // Fallback to rule-based
            const plan = planner.generateDailyPlan();
            if (plan) refreshPage();
          }
        } catch (e) {
          showToast('error', 'AI planning failed', e.message);
          aiBtn.disabled = false;
          aiBtn.textContent = '✨ Generate AI Plan';
        }
      });
    }
  }

  function refreshPage() {
    const container = document.getElementById('app-content');
    if (container) {
      const page = PlannerPage();
      container.innerHTML = page.render();
      page.mount();
    }
  }

  return { render, mount };
}

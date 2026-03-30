// ============================================
// TimeForge — Weekly Review Page (v3.0)
// ============================================

import { state } from '../core/state.js';
import { today, formatDate, formatDuration, getWeekDates } from '../core/utils.js';
import { collector } from '../agents/collector.js';
import { analyzer } from '../agents/analyzer.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';

export function WeeklyReviewPage() {
  let reviewData = null;
  let weekSummary = null;

  function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  function render() {
    const weekStart = getWeekStart();
    const weekAnalysis = analyzer.analyzeWeek();

    // bestDay and worstDay are date strings from analyzer
    const bestDayDate = weekAnalysis.bestDay;
    const worstDayDate = weekAnalysis.worstDay;
    const bestDayIdx = weekAnalysis.dates.indexOf(bestDayDate);
    const worstDayIdx = weekAnalysis.dates.indexOf(worstDayDate);
    const bestDaySummary = bestDayIdx >= 0 ? weekAnalysis.dailySummaries[bestDayIdx] : null;
    const worstDaySummary = worstDayIdx >= 0 ? weekAnalysis.dailySummaries[worstDayIdx] : null;

    weekSummary = {
      totalProductive: weekAnalysis.totalProductive,
      totalWasted: weekAnalysis.totalWasted,
      avgProductive: weekAnalysis.avgProductive,
      avgWasted: weekAnalysis.avgWasted,
      bestDayDate,
      worstDayDate,
      bestDayProductive: bestDaySummary?.productiveMinutes || 0,
      worstDayWasted: worstDaySummary?.wastedMinutes || 0,
      logCount: weekAnalysis.dailySummaries.reduce((sum, s) => sum + s.logCount, 0),
      daysLogged: weekAnalysis.dailySummaries.filter(s => s.logCount > 0).length,
    };

    const streaks = state.get('streaks') || {};
    const rewards = state.get('rewards') || {};

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>📋 Weekly Review</h1>
          <p>Reflect on your week. Identify patterns. Set your focus. This is how you grow.</p>
        </div>

        <!-- Week Summary -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">📊 WEEK AT A GLANCE — ${formatDate(weekStart)}</h3>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4);">
            <div class="stat-card-mini">
              <div class="stat-label">Deep Work</div>
              <div class="stat-value" style="color: var(--color-success);">${formatDuration(weekSummary.totalProductive)}</div>
              <div class="stat-sub">avg ${formatDuration(weekSummary.avgProductive)}/day</div>
            </div>
            <div class="stat-card-mini">
              <div class="stat-label">Wasted Time</div>
              <div class="stat-value" style="color: var(--color-danger);">${formatDuration(weekSummary.totalWasted)}</div>
              <div class="stat-sub">avg ${formatDuration(weekSummary.avgWasted)}/day</div>
            </div>
            <div class="stat-card-mini">
              <div class="stat-label">Streak</div>
              <div class="stat-value" style="color: var(--accent-primary);">${streaks.current || 0} days</div>
              <div class="stat-sub">best: ${streaks.best || 0}</div>
            </div>
            <div class="stat-card-mini">
              <div class="stat-label">Level</div>
              <div class="stat-value">${rewards.levelName || 'Novice'}</div>
              <div class="stat-sub">${rewards.xp || 0} XP</div>
            </div>
            <div class="stat-card-mini">
              <div class="stat-label">Days Logged</div>
              <div class="stat-value">${weekSummary.daysLogged}/7</div>
              <div class="stat-sub">${weekSummary.logCount} entries</div>
            </div>
          </div>
        </div>

        <!-- Best & Worst Day -->
        <div class="grid-2 mb-6">
          <div class="glass-card no-hover" style="border-left: 3px solid var(--color-success);">
            <h4 class="text-sm font-semibold text-muted mb-2">✅ BEST DAY</h4>
            <div class="font-semibold">${weekSummary.daysLogged > 0 ? formatDate(weekSummary.bestDayDate) : 'N/A'}</div>
            <div class="text-sm text-secondary mt-1">${weekSummary.bestDayProductive > 0 ? formatDuration(weekSummary.bestDayProductive) + ' productive' : 'No data yet'}</div>
          </div>
          <div class="glass-card no-hover" style="border-left: 3px solid var(--color-danger);">
            <h4 class="text-sm font-semibold text-muted mb-2">❌ WORST DAY</h4>
            <div class="font-semibold">${weekSummary.daysLogged > 0 ? formatDate(weekSummary.worstDayDate) : 'N/A'}</div>
            <div class="text-sm text-secondary mt-1">${weekSummary.worstDayWasted > 0 ? formatDuration(weekSummary.worstDayWasted) + ' wasted' : 'No data yet'}</div>
          </div>
        </div>

        <!-- Reflection Form -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">🪞 REFLECTION</h3>
          
          <div class="form-group mb-4">
            <label class="form-label">What went wrong this week? Be honest with yourself.</label>
            <textarea class="form-input form-textarea" id="review-reflection" rows="4" 
                      placeholder="Example: I wasted 3 hours on YouTube on Tuesday because I was stuck on a coding problem and didn't ask for help..."
            >${reviewData?.reflection_text || ''}</textarea>
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Next week's ONE focus (pick ONE thing to improve)</label>
            <select class="form-input form-select" id="review-focus">
              <option value="">Choose your focus...</option>
              <option value="Reduce phone time by 30 minutes" ${reviewData?.focus_area === 'Reduce phone time by 30 minutes' ? 'selected' : ''}>📱 Reduce phone time by 30 minutes</option>
              <option value="Start deep work before 10 AM" ${reviewData?.focus_area === 'Start deep work before 10 AM' ? 'selected' : ''}>🌅 Start deep work before 10 AM</option>
              <option value="No Instagram before completing 2 hours of work" ${reviewData?.focus_area === 'No Instagram before completing 2 hours of work' ? 'selected' : ''}>🚫 No Instagram before completing 2 hours of work</option>
              <option value="Sleep by midnight" ${reviewData?.focus_area === 'Sleep by midnight' ? 'selected' : ''}>🌙 Sleep by midnight</option>
              <option value="Follow the daily plan at least 70%" ${reviewData?.focus_area === 'Follow the daily plan at least 70%' ? 'selected' : ''}>📋 Follow the daily plan at least 70%</option>
              <option value="Take real breaks instead of fake rest" ${reviewData?.focus_area === 'Take real breaks instead of fake rest' ? 'selected' : ''}>🧘 Take real breaks instead of fake rest</option>
              <option value="custom">✏️ Custom...</option>
            </select>
            <input type="text" class="form-input mt-2" id="review-focus-custom" placeholder="Type your custom focus..." 
                   style="display: none;" value="${reviewData?.focus_area || ''}">
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Rate your week (1 = terrible, 5 = amazing)</label>
            <div class="mood-selector" id="review-rating">
              ${[1,2,3,4,5].map(r => `
                <button class="mood-option ${r === (reviewData?.rating || 3) ? 'selected' : ''}" data-rating="${r}">
                  ${r === 1 ? '😫' : r === 2 ? '😟' : r === 3 ? '😐' : r === 4 ? '🙂' : '😄'}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="glass-card no-hover">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-sm font-semibold">Complete your review to earn <span style="color: var(--accent-primary);">+100 XP</span></div>
              <div class="text-xs text-muted mt-1">Reviews build consistency. 4 weeks in a row unlocks a special badge! 🏅</div>
            </div>
            <button class="btn btn-primary btn-lg" id="submit-review-btn">
              ✅ Submit Review
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function mount() {
    let selectedRating = reviewData?.rating || 3;

    // Rating selector
    document.querySelectorAll('#review-rating .mood-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.rating);
        document.querySelectorAll('#review-rating .mood-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Custom focus toggle
    const focusSelect = document.getElementById('review-focus');
    const focusCustom = document.getElementById('review-focus-custom');
    if (focusSelect && focusCustom) {
      focusSelect.addEventListener('change', () => {
        focusCustom.style.display = focusSelect.value === 'custom' ? 'block' : 'none';
      });
    }

    // Submit
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const reflection = document.getElementById('review-reflection')?.value?.trim() || '';
        const focusVal = focusSelect?.value;
        const focus = focusVal === 'custom' ? focusCustom?.value?.trim() || '' : focusVal || '';

        if (reflection.length < 10) {
          showToast('warning', 'Write a reflection', 'At least 10 characters — be honest with yourself.');
          return;
        }
        if (!focus) {
          showToast('warning', 'Pick your focus', 'Select ONE thing to improve next week.');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving...';

        // Save locally
        const weekStart = getWeekStart();
        const reviews = state.get('weeklyReviews') || {};
        reviews[weekStart] = {
          weekStart,
          reflection,
          focus,
          rating: selectedRating,
          completedAt: new Date().toISOString(),
        };
        state.set('weeklyReviews', reviews);

        // XP reward
        const rewards = state.get('rewards') || {};
        rewards.xp = (rewards.xp || 0) + 100;
        state.set('rewards', rewards);

        // Sync to backend
        if (api.isAuthenticated && api.isOnline) {
          try {
            await api.submitReview({
              week_start_date: weekStart,
              reflection_text: reflection,
              focus_area: focus,
              wins: [],
              rating: selectedRating,
            });
          } catch (e) {
            console.warn('Review sync failed:', e.message);
          }
        }

        showToast('success', '📋 Review Submitted! +100 XP', `Focus for next week: ${focus}`);
        
        // Navigate to dashboard
        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 1500);
      });
    }

    // Load existing review from backend
    if (api.isAuthenticated && api.isOnline) {
      api.getCurrentReview().then(review => {
        if (review && review.completed_at) {
          // Already completed — show success state
          const submitBtn = document.getElementById('submit-review-btn');
          if (submitBtn) {
            submitBtn.textContent = '✅ Already Completed';
            submitBtn.disabled = true;
          }
        }
      }).catch(() => {});
    }
  }

  return { render, mount };
}

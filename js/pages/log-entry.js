// ============================================
// STD TIME TRACKER — Log Entry Page
// ============================================

import { state } from '../core/state.js';
import { router } from '../core/router.js';
import { $, today, formatDate, getCurrentTime, formatTime, formatDuration } from '../core/utils.js';
import { collector } from '../agents/collector.js';
import { classifyActivity, CATEGORIES, getCategoryByName, getWastedCategories } from '../data/categories.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { api } from '../core/api.js';

export function LogEntryPage() {
  let selectedCategory = null;
  let selectedMood = 3;
  let selectedEnergy = 3;

  function render() {
    const templates = collector.quickTemplates;
    const recent = collector.getRecentActivities(8);
    const suggested = collector.getSuggestedActivity();

    return `
      <div class="page-container stagger-children">
        <div class="page-header">
          <h1>Log Activity</h1>
          <p>Track what you did. Honesty is everything — the system only works with real data.</p>
        </div>

        <!-- Quick Templates -->
        <div class="glass-card no-hover mb-6">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary);">⚡ Quick Log</h3>
          <div class="log-templates">
            ${templates.map(t => `
              <button class="log-template-btn" data-template="${t.name}" data-category="${t.category}">
                ${t.icon} ${t.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Log Form -->
        <div class="glass-card no-hover">
          <div class="log-form">
            <!-- Activity Name -->
            <div class="form-group">
              <label class="form-label">Activity</label>
              <input type="text" class="form-input" id="log-activity" 
                     placeholder="${suggested ? suggested : 'What did you do?'}"
                     autocomplete="off"
                     style="font-size: var(--text-lg);">
              ${recent.length > 0 ? `
                <div class="flex flex-wrap gap-2 mt-2">
                  ${recent.slice(0, 5).map(r => `
                    <button class="log-template-btn recent-btn" data-recent="${r.name}" data-category="${r.category}" style="font-size:11px;">
                      ${r.name}
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Time -->
            <div class="time-input-group">
              <div class="form-group">
                <label class="form-label">Start Time</label>
                <input type="time" class="form-input font-mono" id="log-start" value="${getCurrentTime()}">
              </div>
              <span class="time-separator">→</span>
              <div class="form-group">
                <label class="form-label">End Time</label>
                <input type="time" class="form-input font-mono" id="log-end" value="${getCurrentTime()}">
              </div>
            </div>

            <!-- Duration Preview -->
            <div id="duration-preview" class="category-preview" style="display:none;">
              <span class="font-mono text-sm" id="duration-text"></span>
            </div>

            <!-- Category -->
            <div class="form-group">
              <label class="form-label">Category (auto-detected)</label>
              <div class="category-preview" id="category-display">
                <div class="category-dot" style="background: var(--text-muted);"></div>
                <span class="text-secondary text-sm">Start typing to auto-detect category...</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-3">
                ${CATEGORIES.map(c => `
                  <button class="goal-chip category-chip" data-category="${c.name}" style="font-size: 12px;">
                    ${c.icon} ${c.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Date -->
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input font-mono" id="log-date" value="${today()}">
            </div>

            <!-- Mood & Energy -->
            <div class="grid-2" style="gap: var(--space-6);">
              <div class="form-group">
                <label class="form-label">Mood</label>
                <div class="mood-selector" id="mood-selector">
                  ${['😫', '😟', '😐', '🙂', '😄'].map((emoji, i) => `
                    <button class="mood-option ${i + 1 === selectedMood ? 'selected' : ''}" data-mood="${i + 1}">${emoji}</button>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Energy Level</label>
                <div class="energy-selector" id="energy-selector">
                  ${[1, 2, 3, 4, 5].map(level => `
                    <button class="energy-option ${level === selectedEnergy ? 'selected' : ''}" data-energy="${level}">
                      ${'⚡'.repeat(level)}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label">Notes (optional)</label>
              <textarea class="form-input form-textarea" id="log-notes" placeholder="Any context? What went well? What distracted you?"></textarea>
            </div>

            <!-- Submit -->
            <div class="flex gap-3 justify-end mt-4">
              <button class="btn btn-secondary" id="log-clear">Clear</button>
              <button class="btn btn-primary btn-lg" id="log-submit">
                ✓ Log Activity
              </button>
            </div>
          </div>
        </div>

        <!-- Today's Logs -->
        <div class="glass-card no-hover mt-6" id="today-logs-section">
          <h3 class="font-semibold mb-4 text-sm" style="text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary);">📋 Today's Entries</h3>
          ${renderTodayLogs()}
        </div>
      </div>
    `;
  }

  function renderTodayLogs() {
    const logs = state.getLogsForDate(today());
    if (logs.length === 0) {
      return '<p class="text-muted text-sm">No entries yet today.</p>';
    }

    return `
      <div class="flex-col gap-3">
        ${logs.map(log => `
          <div class="flex items-center justify-between p-4" style="background: var(--glass-bg); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
            <div class="flex items-center gap-3">
              <div class="category-dot" style="background: ${getCategoryByName(log.category)?.color || '#6b7280'};"></div>
              <div>
                <div class="font-semibold text-sm">${log.activity}</div>
                <div class="text-xs text-muted font-mono">${formatTime(log.startTime)} — ${formatTime(log.endTime)} · ${formatDuration(log.duration)}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-${log.category.toLowerCase().replace(/\s+/g, '-')}">${log.category}</span>
              <button class="btn btn-icon btn-ghost text-danger log-delete" data-id="${log.id}" style="width:28px; height:28px; font-size:14px;">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function mount() {
    // Quick template buttons
    document.querySelectorAll('.log-template-btn, .recent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const activity = btn.dataset.template || btn.dataset.recent;
        const category = btn.dataset.category;
        const input = $('#log-activity');
        if (input) input.value = activity;
        if (category) {
          selectedCategory = category;
          updateCategoryDisplay(category);
          document.querySelectorAll('.category-chip').forEach(c => {
            c.classList.toggle('selected', c.dataset.category === category);
          });
        }
      });
    });

    // Activity input — auto-classify
    const activityInput = $('#log-activity');
    if (activityInput) {
      activityInput.addEventListener('input', () => {
        const val = activityInput.value.trim();
        if (val.length >= 2) {
          const detected = classifyActivity(val);
          selectedCategory = detected;
          updateCategoryDisplay(detected);
          document.querySelectorAll('.category-chip').forEach(c => {
            c.classList.toggle('selected', c.dataset.category === detected);
          });
        }
      });
    }

    // Category chips (manual override)
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.dataset.category;
        updateCategoryDisplay(selectedCategory);
        document.querySelectorAll('.category-chip').forEach(c => {
          c.classList.toggle('selected', c.dataset.category === selectedCategory);
        });
      });
    });

    // Time change — show duration
    ['log-start', 'log-end'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.addEventListener('change', updateDurationPreview);
    });

    // Mood selector
    document.querySelectorAll('.mood-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMood = parseInt(btn.dataset.mood);
        document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Energy selector
    document.querySelectorAll('.energy-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedEnergy = parseInt(btn.dataset.energy);
        document.querySelectorAll('.energy-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Submit
    const submitBtn = $('#log-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }

    // Clear
    const clearBtn = $('#log-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (activityInput) activityInput.value = '';
        selectedCategory = null;
        selectedMood = 3;
        selectedEnergy = 3;
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.energy-option').forEach(b => b.classList.remove('selected'));
        // Re-select defaults
        document.querySelector('.mood-option[data-mood="3"]')?.classList.add('selected');
        document.querySelector('.energy-option[data-energy="3"]')?.classList.add('selected');
        updateCategoryDisplay(null);
      });
    }

    // Delete buttons
    document.querySelectorAll('.log-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        state.deleteLog(id);
        showToast('info', 'Entry deleted', 'Activity log removed');
        refreshLogsSection();
      });
    });
  }

  function handleSubmit() {
    const activity = $('#log-activity')?.value?.trim();
    const startTime = $('#log-start')?.value;
    const endTime = $('#log-end')?.value;
    const date = $('#log-date')?.value || today();
    const notes = $('#log-notes')?.value?.trim() || '';

    const result = collector.createLog({
      activity,
      startTime,
      endTime,
      mood: selectedMood,
      energy: selectedEnergy,
      category: selectedCategory,
      notes,
      date,
    });

    if (result.success) {
      showToast('success', 'Activity Logged! ✓', `${activity} — ${formatDuration(result.log.duration)}`);
      
      // Check if wasted category → show friction modal
      const wastedCats = getWastedCategories();
      const logCategory = result.log.category;
      if (wastedCats.includes(logCategory)) {
        showFrictionModal(result.log);
      }

      // Clear form
      if ($('#log-activity')) $('#log-activity').value = '';
      if ($('#log-start')) $('#log-start').value = endTime;
      if ($('#log-notes')) $('#log-notes').value = '';
      selectedCategory = null;
      updateCategoryDisplay(null);
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
      
      refreshLogsSection();
    } else {
      showToast('error', 'Cannot log', result.error);
    }
  }

  function showFrictionModal(log) {
    const content = `
      <div style="margin-bottom: var(--space-4);">
        <p class="text-sm text-secondary" style="margin-bottom: var(--space-4);">
          You just logged <strong>${log.activity}</strong> as <strong>${log.category}</strong>.<br>
          Understanding <em>why</em> helps the system find your patterns.
        </p>
        <div class="flex-col gap-2" id="friction-options">
          <button class="btn btn-secondary friction-btn" data-reason="bored" style="justify-content:flex-start; text-align:left;">
            🎯 <strong>Bored</strong> — nothing engaging to do
          </button>
          <button class="btn btn-secondary friction-btn" data-reason="stuck" style="justify-content:flex-start; text-align:left;">
            🧱 <strong>Stuck</strong> — couldn't figure out my task
          </button>
          <button class="btn btn-secondary friction-btn" data-reason="tired" style="justify-content:flex-start; text-align:left;">
            😴 <strong>Tired</strong> — low energy, needed escape
          </button>
          <button class="btn btn-secondary friction-btn" data-reason="autopilot" style="justify-content:flex-start; text-align:left;">
            🤖 <strong>Autopilot</strong> — opened app without thinking
          </button>
          <button class="btn btn-secondary friction-btn" data-reason="emotional" style="justify-content:flex-start; text-align:left;">
            😰 <strong>Emotional</strong> — stressed, anxious, or upset
          </button>
        </div>
      </div>
    `;

    const modal = showModal({
      title: '💡 Why did you go there?',
      content,
      actions: [
        { id: 'skip', label: 'Skip', class: 'btn-ghost', onClick: (close) => close() },
      ],
    });

    // Bind friction buttons
    setTimeout(() => {
      document.querySelectorAll('.friction-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const reason = btn.dataset.reason;
          // Update the log in state with friction data
          state.updateLog(log.id, { frictionReason: reason });
          // Sync to backend
          api.writeWithFallback(`/logs/${log.id}`, 'PUT', { friction_reason: reason }, `Friction: ${reason}`);
          showToast('info', 'Pattern tracked', `Friction: ${reason}`);
          // Close the modal
          const overlay = document.querySelector('.modal-overlay');
          if (overlay) overlay.remove();
        });
      });
    }, 100);
  }

  function updateCategoryDisplay(category) {
    const display = $('#category-display');
    if (!display) return;

    if (category) {
      const cat = getCategoryByName(category);
      display.innerHTML = `
        <div class="category-dot" style="background: ${cat?.color || '#6b7280'};"></div>
        <span class="text-sm font-semibold">${cat?.icon || ''} ${category}</span>
        <span class="text-xs text-muted ml-auto">${cat?.description || ''}</span>
      `;
    } else {
      display.innerHTML = `
        <div class="category-dot" style="background: var(--text-muted);"></div>
        <span class="text-secondary text-sm">Start typing to auto-detect category...</span>
      `;
    }
  }

  function updateDurationPreview() {
    const start = $('#log-start')?.value;
    const end = $('#log-end')?.value;
    const preview = $('#duration-preview');
    const text = $('#duration-text');

    if (start && end && preview && text) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      
      text.textContent = `Duration: ${formatDuration(diff)}`;
      preview.style.display = diff > 0 ? 'flex' : 'none';
    }
  }

  function refreshLogsSection() {
    const section = $('#today-logs-section');
    if (section) {
      const header = '<h3 class="font-semibold mb-4 text-sm" style="text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary);">📋 Today\'s Entries</h3>';
      section.innerHTML = header + renderTodayLogs();
      // Re-bind delete buttons
      section.querySelectorAll('.log-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          state.deleteLog(btn.dataset.id);
          showToast('info', 'Entry deleted', 'Activity log removed');
          refreshLogsSection();
        });
      });
    }
  }

  return { render, mount };
}

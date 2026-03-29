// ============================================
// STD TIME TRACKER — Goals Page
// ============================================

import { state } from '../core/state.js';
import { $, generateId, today, formatDate, daysBetween, formatDuration } from '../core/utils.js';
import { planner } from '../agents/planner.js';
import { collector } from '../agents/collector.js';
import { showToast } from '../components/toast.js';
import { showModal, showConfirm } from '../components/modal.js';

export function GoalsPage() {
  function render() {
    const goals = state.get('goals') || [];

    return `
      <div class="page-container stagger-children">
        <div class="page-header flex justify-between items-center">
          <div>
            <h1>Goals</h1>
            <p>Define what you're working toward. Every plan and insight revolves around these.</p>
          </div>
          <button class="btn btn-primary" id="add-goal-btn">+ Add Goal</button>
        </div>

        ${goals.length > 0 ? `
          <div class="grid-auto">
            ${goals.map(goal => renderGoalCard(goal)).join('')}
          </div>
        ` : `
          <div class="glass-card no-hover">
            <div class="empty-state">
              <div class="empty-icon">🎯</div>
              <h3>No goals set yet</h3>
              <p>Goals drive everything — your daily plan, compliance scoring, and recommendations. Set at least one to unlock the full system.</p>
              <button class="btn btn-primary mt-4" id="add-goal-empty">Set Your First Goal</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function renderGoalCard(goal) {
    const effort = planner.calculateDailyEffort(goal);
    const daysLeft = goal.deadline ? daysBetween(today(), goal.deadline) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;
    const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

    return `
      <div class="glass-card no-hover goal-card">
        <div class="goal-header">
          <div>
            <div class="goal-title">${goal.title}</div>
            <div class="text-xs text-muted mt-1">${goal.type || 'General'}</div>
          </div>
          <div class="flex gap-2">
            ${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : ''}
            ${isUrgent ? '<span class="badge badge-warning">Urgent</span>' : ''}
            <button class="btn btn-icon btn-ghost goal-delete-btn" data-id="${goal.id}" style="width:28px;height:28px;font-size:14px;">✕</button>
          </div>
        </div>

        <div class="goal-metric">
          <span>Progress</span>
          <span class="font-mono">${goal.progress || 0}%</span>
        </div>
        <div class="progress-bar mb-4" style="height:8px;">
          <div class="progress-bar-fill" style="width:${goal.progress || 0}%; background: ${(goal.progress || 0) >= 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)'};"></div>
        </div>

        ${goal.deadline ? `
          <div class="flex items-center justify-between text-xs text-muted mb-3">
            <span>Deadline: ${formatDate(goal.deadline)}</span>
            <span class="font-mono">${isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}</span>
          </div>
        ` : ''}

        ${effort && !effort.overdue ? `
          <div class="p-3" style="background:var(--glass-bg); border-radius:var(--radius-md); border:1px solid var(--glass-border);">
            <div class="text-xs font-semibold text-muted mb-1">DAILY EFFORT NEEDED</div>
            <div class="text-sm">~${effort.dailyPercent}% per day · ${effort.onTrack ? '✅ On track' : '⚠️ Need to accelerate'}</div>
          </div>
        ` : ''}

        <div class="flex gap-2 mt-4">
          <button class="btn btn-sm btn-secondary goal-progress-btn" data-id="${goal.id}" data-progress="${goal.progress || 0}">Update Progress</button>
        </div>
      </div>
    `;
  }

  function mount() {
    // Add goal button
    const addBtns = document.querySelectorAll('#add-goal-btn, #add-goal-empty');
    addBtns.forEach(btn => {
      btn?.addEventListener('click', () => openGoalModal());
    });

    // Delete buttons
    document.querySelectorAll('.goal-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        showConfirm({
          title: 'Delete Goal?',
          message: 'This action cannot be undone.',
          confirmText: 'Delete',
          danger: true,
          onConfirm: () => {
            state.deleteGoal(id);
            showToast('info', 'Goal deleted');
            refreshPage();
          }
        });
      });
    });

    // Progress buttons
    document.querySelectorAll('.goal-progress-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const current = parseInt(btn.dataset.progress) || 0;
        const content = `
          <div class="form-group">
            <label class="form-label">Current Progress: ${current}%</label>
            <input type="range" class="form-input" id="progress-slider" min="0" max="100" value="${current}" 
                   style="cursor:pointer; accent-color: var(--accent-primary);">
            <div class="text-center font-mono text-2xl mt-2" id="progress-display">${current}%</div>
          </div>
        `;
        const modal = showModal({
          title: 'Update Progress',
          content,
          actions: [
            { id: 'save', label: 'Save', class: 'btn btn-primary', onClick: (close) => {
              const val = document.getElementById('progress-slider')?.value || current;
              state.updateGoal(id, { progress: parseInt(val) });
              showToast('success', 'Progress updated!');
              close();
              refreshPage();
            }},
          ],
        });

        // Live slider update
        setTimeout(() => {
          const slider = document.getElementById('progress-slider');
          const display = document.getElementById('progress-display');
          if (slider && display) {
            slider.addEventListener('input', () => {
              display.textContent = slider.value + '%';
            });
          }
        }, 100);
      });
    });
  }

  function openGoalModal() {
    const content = `
      <div class="flex-col gap-4">
        <div class="form-group">
          <label class="form-label">Goal Title</label>
          <input type="text" class="form-input" id="goal-title" placeholder="e.g., Crack GATE 2027">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-input form-select" id="goal-type">
            <option value="Academic">Academic</option>
            <option value="Career">Career</option>
            <option value="Health">Health</option>
            <option value="Skill">Skill Building</option>
            <option value="Habit">Habit Formation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline (optional)</label>
          <input type="date" class="form-input font-mono" id="goal-deadline">
        </div>
        <div class="form-group">
          <label class="form-label">Daily Effort (hours)</label>
          <input type="number" class="form-input font-mono" id="goal-effort" min="0.5" max="12" step="0.5" value="2">
        </div>
      </div>
    `;

    showModal({
      title: 'Create New Goal',
      content,
      actions: [
        { id: 'cancel', label: 'Cancel', class: 'btn-ghost', onClick: (close) => close() },
        { id: 'create', label: 'Create Goal', class: 'btn btn-primary', onClick: (close) => {
          const title = document.getElementById('goal-title')?.value?.trim();
          if (!title) { showToast('warning', 'Title required'); return; }
          
          state.addGoal({
            id: generateId(),
            title,
            type: document.getElementById('goal-type')?.value || 'Other',
            deadline: document.getElementById('goal-deadline')?.value || null,
            dailyEffort: parseFloat(document.getElementById('goal-effort')?.value) || 2,
            progress: 0,
            milestones: [],
            priority: 'medium',
            createdAt: new Date().toISOString(),
          });

          collector.unlockAchievement('first_goal');
          showToast('success', 'Goal created! 🎯', title);
          close();
          refreshPage();
        }},
      ],
    });
  }

  function refreshPage() {
    const container = document.getElementById('app-content');
    if (container) {
      const page = GoalsPage();
      container.innerHTML = page.render();
      page.mount();
    }
  }

  return { render, mount };
}

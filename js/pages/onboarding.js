// ============================================
// STD TIME TRACKER — Onboarding Page
// ============================================

import { state } from '../core/state.js';
import { router } from '../core/router.js';
import { $ } from '../core/utils.js';
import { showToast } from '../components/toast.js';

const STEPS = [
  {
    emoji: '⏱️',
    title: 'Welcome to TimeForge',
    desc: 'The AI-powered time intelligence engine that transforms how you spend every hour. No motivational fluff — just data, patterns, and brutal honesty.',
    field: null,
  },
  {
    emoji: '👤',
    title: "What's your name?",
    desc: "We'll use this to personalize your experience. Just your first name is fine.",
    field: 'name',
  },
  {
    emoji: '🌅',
    title: 'When do you wake up?',
    desc: 'Your natural wake time helps us plan your most productive hours.',
    field: 'wakeTime',
  },
  {
    emoji: '🌙',
    title: 'When do you sleep?',
    desc: 'Sleep time is sacred. We need to know when your day ends.',
    field: 'sleepTime',
  },
  {
    emoji: '🎯',
    title: 'What are your goals?',
    desc: 'Select what you\'re working toward. We\'ll build your system around these.',
    field: 'goals',
  },
  {
    emoji: '🚀',
    title: 'You\'re Ready',
    desc: 'Your personal time intelligence engine is activated. Log your first activity to see the magic begin.',
    field: null,
  },
];

const GOAL_OPTIONS = [
  'Crack competitive exam (JEE/GATE/UPSC/CAT)',
  'Improve college GPA',
  'Learn programming/coding',
  'Build a project/portfolio',
  'Get internship/placement ready',
  'Develop a daily routine',
  'Reduce phone/social media time',
  'Sleep schedule fix',
  'Fitness & health goals',
  'Learn a new skill',
];

export function OnboardingPage() {
  let currentStep = 0;
  let formData = {
    name: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    goals: [],
  };

  function render() {
    return `
      <div class="onboarding-page" id="onboarding-page">
        <div class="onboarding-container">
          <div class="onboarding-progress" id="onboarding-progress">
            ${STEPS.map((_, i) => `
              <div class="onboarding-progress-dot ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}"></div>
            `).join('')}
          </div>

          <div class="onboarding-card glass-card no-hover" id="onboarding-card">
            ${renderStep(currentStep)}
          </div>
        </div>
      </div>
    `;
  }

  function renderStep(step) {
    const s = STEPS[step];
    let fieldHTML = '';

    switch (s.field) {
      case 'name':
        fieldHTML = `
          <div class="form-group">
            <input type="text" class="form-input" id="onb-name" placeholder="Your name..." 
                   value="${formData.name}" autocomplete="off"
                   style="font-size: var(--text-lg); padding: var(--space-4) var(--space-5);">
          </div>
        `;
        break;
      case 'wakeTime':
        fieldHTML = `
          <div class="form-group">
            <input type="time" class="form-input" id="onb-wake" value="${formData.wakeTime}"
                   style="font-size: var(--text-lg); padding: var(--space-4) var(--space-5); font-family: var(--font-mono);">
          </div>
        `;
        break;
      case 'sleepTime':
        fieldHTML = `
          <div class="form-group">
            <input type="time" class="form-input" id="onb-sleep" value="${formData.sleepTime}"
                   style="font-size: var(--text-lg); padding: var(--space-4) var(--space-5); font-family: var(--font-mono);">
          </div>
        `;
        break;
      case 'goals':
        fieldHTML = `
          <div class="goal-chips" id="goal-chips">
            ${GOAL_OPTIONS.map(g => `
              <button class="goal-chip ${formData.goals.includes(g) ? 'selected' : ''}" data-goal="${g}">${g}</button>
            `).join('')}
          </div>
        `;
        break;
    }

    return `
      <span class="step-emoji">${s.emoji}</span>
      <h2>${s.title}</h2>
      <p class="step-desc">${s.desc}</p>
      ${fieldHTML}
      <div class="onboarding-actions">
        ${step > 0 ? '<button class="btn btn-ghost" id="onb-back">← Back</button>' : '<div></div>'}
        <button class="btn btn-primary btn-lg" id="onb-next">
          ${step === STEPS.length - 1 ? 'Launch TimeForge 🚀' : 'Continue →'}
        </button>
      </div>
    `;
  }

  function mount() {
    bindEvents();
  }

  function bindEvents() {
    const card = $('#onboarding-card');
    if (!card) return;

    const nextBtn = $('#onb-next');
    const backBtn = $('#onb-back');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        saveCurrentStepData();

        if (currentStep === 1 && !formData.name.trim()) {
          showToast('warning', 'Name required', 'Please enter your name to continue');
          return;
        }

        if (currentStep < STEPS.length - 1) {
          currentStep++;
          updateUI();
        } else {
          completeOnboarding();
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          updateUI();
        }
      });
    }

    // Goal chips
    const goalChips = document.querySelectorAll('.goal-chip');
    goalChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const goal = chip.dataset.goal;
        if (formData.goals.includes(goal)) {
          formData.goals = formData.goals.filter(g => g !== goal);
          chip.classList.remove('selected');
        } else {
          formData.goals.push(goal);
          chip.classList.add('selected');
        }
      });
    });
  }

  function saveCurrentStepData() {
    const nameInput = $('#onb-name');
    const wakeInput = $('#onb-wake');
    const sleepInput = $('#onb-sleep');

    if (nameInput) formData.name = nameInput.value;
    if (wakeInput) formData.wakeTime = wakeInput.value;
    if (sleepInput) formData.sleepTime = sleepInput.value;
  }

  function updateUI() {
    const card = $('#onboarding-card');
    const progress = $('#onboarding-progress');

    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(() => {
        card.innerHTML = renderStep(currentStep);
        card.style.transition = 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
        bindEvents();
      }, 200);
    }

    if (progress) {
      progress.innerHTML = STEPS.map((_, i) =>
        `<div class="onboarding-progress-dot ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}"></div>`
      ).join('');
    }
  }

  function completeOnboarding() {
    state.set('user', {
      name: formData.name.trim(),
      wakeTime: formData.wakeTime,
      sleepTime: formData.sleepTime,
      goals: formData.goals,
      createdAt: new Date().toISOString(),
    });

    showToast('success', 'Welcome, ' + formData.name + '! 🎉', 'Your time intelligence engine is ready.');
    
    setTimeout(() => {
      router.navigate('/dashboard');
      // Force full page reload to show navbar
      setTimeout(() => location.reload(), 100);
    }, 500);
  }

  return { render, mount };
}

// ============================================
// STD TIME TRACKER — State Manager
// ============================================

import { events, EVENTS } from './events.js';

const STORAGE_KEY = 'std_time_tracker_state';

const defaultState = {
  user: null,  // { name, wakeTime, sleepTime, goals: [], createdAt }
  logs: [],    // [{ id, activity, category, startTime, endTime, mood, energy, notes, date, createdAt }]
  goals: [],   // [{ id, title, type, deadline, dailyEffort, progress, milestones, priority, createdAt }]
  plans: {},   // { 'YYYY-MM-DD': [{ time, activity, category, duration, completed }] }
  streaks: {
    current: 0,
    best: 0,
    history: [],  // [{ date, compliance }]
  },
  rewards: {
    xp: 0,
    level: 1,
    levelName: 'Novice',
    achievements: [],
    unlockedRewards: [],
  },
  analysis: {
    userType: null,
    lastAnalysis: null,
    patterns: {},
  },
  settings: {
    theme: 'dark',
    notifications: true,
    strictMode: true,
    pomodoroLength: 25,
    breakLength: 5,
  },
};

class StateManager {
  constructor() {
    this.state = this.load();
    this.subscribers = [];
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.merge(defaultState, parsed);
      }
    } catch (e) {
      console.warn('Failed to load state, using defaults', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  merge(defaults, saved) {
    const result = {};
    for (const key of Object.keys(defaults)) {
      if (saved.hasOwnProperty(key)) {
        if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
          result[key] = this.merge(defaults[key], saved[key] || {});
        } else {
          result[key] = saved[key];
        }
      } else {
        result[key] = JSON.parse(JSON.stringify(defaults[key]));
      }
    }
    return result;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value) {
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
    this.notify(path, value);
    events.emit(EVENTS.STATE_CHANGED, { path, value });
  }

  update(path, updater) {
    const current = this.get(path);
    const newValue = updater(current);
    this.set(path, newValue);
    return newValue;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify(path, value) {
    this.subscribers.forEach(cb => {
      try {
        cb(path, value, this.state);
      } catch (e) {
        console.error('State subscriber error:', e);
      }
    });
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.state = this.merge(defaultState, data);
      this.save();
      this.notify('*', this.state);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.save();
    this.notify('*', this.state);
  }

  // Convenience methods
  addLog(log) {
    this.state.logs.push(log);
    this.save();
    this.notify('logs', this.state.logs);
    events.emit(EVENTS.LOG_CREATED, log);
  }

  updateLog(id, updates) {
    const idx = this.state.logs.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.logs[idx] = { ...this.state.logs[idx], ...updates };
      this.save();
      this.notify('logs', this.state.logs);
      events.emit(EVENTS.LOG_UPDATED, this.state.logs[idx]);
    }
  }

  deleteLog(id) {
    this.state.logs = this.state.logs.filter(l => l.id !== id);
    this.save();
    this.notify('logs', this.state.logs);
    events.emit(EVENTS.LOG_DELETED, { id });
  }

  getLogsForDate(date) {
    return this.state.logs.filter(l => l.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  addGoal(goal) {
    this.state.goals.push(goal);
    this.save();
    this.notify('goals', this.state.goals);
    events.emit(EVENTS.GOAL_CREATED, goal);
  }

  updateGoal(id, updates) {
    const idx = this.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.goals[idx] = { ...this.state.goals[idx], ...updates };
      this.save();
      events.emit(EVENTS.GOAL_UPDATED, this.state.goals[idx]);
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.save();
  }

  setPlanForDate(date, plan) {
    this.state.plans[date] = plan;
    this.save();
    events.emit(EVENTS.PLAN_GENERATED, { date, plan });
  }

  addXP(amount) {
    this.state.rewards.xp += amount;
    const levelInfo = this.calculateLevel(this.state.rewards.xp);
    const oldLevel = this.state.rewards.level;
    this.state.rewards.level = levelInfo.level;
    this.state.rewards.levelName = levelInfo.name;
    this.save();
    events.emit(EVENTS.XP_GAINED, { amount, total: this.state.rewards.xp });
    if (levelInfo.level > oldLevel) {
      events.emit(EVENTS.LEVEL_UP, levelInfo);
    }
  }

  calculateLevel(xp) {
    const levels = [
      { level: 1, name: 'Novice', threshold: 0 },
      { level: 2, name: 'Beginner', threshold: 100 },
      { level: 3, name: 'Apprentice', threshold: 300 },
      { level: 4, name: 'Disciplined', threshold: 600 },
      { level: 5, name: 'Focused', threshold: 1000 },
      { level: 6, name: 'Dedicated', threshold: 1500 },
      { level: 7, name: 'Elite', threshold: 2200 },
      { level: 8, name: 'Master', threshold: 3000 },
      { level: 9, name: 'Legendary', threshold: 4000 },
      { level: 10, name: 'Transcendent', threshold: 5500 },
    ];

    let current = levels[0];
    for (const lvl of levels) {
      if (xp >= lvl.threshold) {
        current = lvl;
      } else {
        break;
      }
    }
    return current;
  }

  getLevelProgress() {
    const levels = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 999999];
    const xp = this.state.rewards.xp;
    const lvl = this.state.rewards.level;
    const current = levels[lvl - 1] || 0;
    const next = levels[lvl] || levels[levels.length - 1];
    return {
      current: xp - current,
      needed: next - current,
      percent: Math.min(100, ((xp - current) / (next - current)) * 100)
    };
  }
}

export const state = new StateManager();

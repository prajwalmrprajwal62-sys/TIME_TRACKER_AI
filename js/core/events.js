// ============================================
// STD TIME TRACKER — Event Bus
// ============================================

class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`EventBus error on "${event}":`, err);
        }
      });
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

export const events = new EventBus();

// Event constants
export const EVENTS = {
  LOG_CREATED: 'log:created',
  LOG_UPDATED: 'log:updated',
  LOG_DELETED: 'log:deleted',
  ANALYSIS_COMPLETE: 'analysis:complete',
  PROFILE_UPDATED: 'profile:updated',
  PLAN_GENERATED: 'plan:generated',
  PLAN_UPDATED: 'plan:updated',
  COMPLIANCE_UPDATED: 'compliance:updated',
  GOAL_CREATED: 'goal:created',
  GOAL_UPDATED: 'goal:updated',
  STREAK_UPDATED: 'streak:updated',
  REWARD_UNLOCKED: 'reward:unlocked',
  XP_GAINED: 'xp:gained',
  LEVEL_UP: 'level:up',
  ROUTE_CHANGED: 'route:changed',
  STATE_CHANGED: 'state:changed',
  TOAST_SHOW: 'toast:show',
};

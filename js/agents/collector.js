// ============================================
// STD TIME TRACKER — Agent 1: Data Collector
// ============================================

import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';
import { generateId, today, minutesBetween, formatDuration } from '../core/utils.js';
import { classifyActivity, CATEGORIES } from '../data/categories.js';

class DataCollector {
  constructor() {
    this.quickTemplates = [
      { name: 'Instagram/Reels', category: 'Dopamine', icon: '📱' },
      { name: 'YouTube', category: 'Dopamine', icon: '▶️' },
      { name: 'DSA Practice', category: 'Deep Work', icon: '💻' },
      { name: 'College Lecture', category: 'College', icon: '🎓' },
      { name: 'Study Session', category: 'Deep Work', icon: '📖' },
      { name: 'Lunch/Dinner', category: 'Maintenance', icon: '🍽️' },
      { name: 'Sleep', category: 'Good Rest', icon: '😴' },
      { name: 'Gaming', category: 'Dopamine', icon: '🎮' },
      { name: 'Gym/Exercise', category: 'Good Rest', icon: '💪' },
      { name: 'Friends Hangout', category: 'Social', icon: '👥' },
      { name: 'Scrolling in Bed', category: 'Fake Rest', icon: '🛏️' },
      { name: 'Overthinking', category: 'Avoidance', icon: '🧠' },
      { name: 'Coding Project', category: 'Deep Work', icon: '⌨️' },
      { name: 'Commute', category: 'Maintenance', icon: '🚌' },
      { name: 'Meditation', category: 'Good Rest', icon: '🧘' },
    ];
  }

  createLog(data) {
    const { activity, startTime, endTime, mood, energy, notes, date } = data;

    // Validate
    const validation = this.validateLog(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const category = data.category || classifyActivity(activity);
    const duration = minutesBetween(startTime, endTime);

    const log = {
      id: generateId(),
      activity: activity.trim(),
      category,
      startTime,
      endTime,
      duration,
      mood: mood || 3,
      energy: energy || 3,
      notes: notes || '',
      date: date || today(),
      createdAt: new Date().toISOString(),
    };

    state.addLog(log);
    
    // Award XP for logging
    const logsToday = state.getLogsForDate(log.date).length;
    if (logsToday <= 3) {
      state.addXP(5);
    }

    // Check for first log achievement
    if (state.get('logs').length === 1) {
      this.unlockAchievement('first_log');
    }

    // Check milestones
    const totalLogs = state.get('logs').length;
    if (totalLogs >= 50) this.unlockAchievement('logs_50');
    if (totalLogs >= 200) this.unlockAchievement('logs_200');
    if (totalLogs >= 500) this.unlockAchievement('logs_500');

    // Check all categories in one day
    this.checkAllCategoriesAchievement(log.date);

    return { success: true, log };
  }

  validateLog(data) {
    if (!data.activity || data.activity.trim().length === 0) {
      return { valid: false, error: 'Activity name is required' };
    }
    if (!data.startTime) {
      return { valid: false, error: 'Start time is required' };
    }
    if (!data.endTime) {
      return { valid: false, error: 'End time is required' };
    }
    
    const duration = minutesBetween(data.startTime, data.endTime);
    if (duration <= 0) {
      return { valid: false, error: 'End time must be after start time' };
    }
    if (duration > 16 * 60) {
      return { valid: false, error: 'Activity cannot exceed 16 hours' };
    }

    // Check for overlaps with existing logs
    const dateToCheck = data.date || today();
    const existingLogs = state.getLogsForDate(dateToCheck);
    for (const log of existingLogs) {
      if (data.editId && log.id === data.editId) continue;
      if (this.timeOverlaps(data.startTime, data.endTime, log.startTime, log.endTime)) {
        return { valid: false, error: `Overlaps with "${log.activity}" (${log.startTime}-${log.endTime})` };
      }
    }

    return { valid: true };
  }

  timeOverlaps(start1, end1, start2, end2) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const s1 = toMin(start1), e1 = toMin(end1);
    const s2 = toMin(start2), e2 = toMin(end2);
    return s1 < e2 && s2 < e1;
  }

  detectGaps(date) {
    const logs = state.getLogsForDate(date);
    if (logs.length === 0) return [];

    const user = state.get('user');
    const wakeTime = user?.wakeTime || '07:00';
    const sleepTime = user?.sleepTime || '23:00';
    const gaps = [];

    const sorted = [...logs].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Gap before first log
    if (sorted[0].startTime > wakeTime) {
      const gapMin = minutesBetween(wakeTime, sorted[0].startTime);
      if (gapMin >= 30) {
        gaps.push({ start: wakeTime, end: sorted[0].startTime, duration: gapMin });
      }
    }

    // Gaps between logs
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapMin = minutesBetween(sorted[i].endTime, sorted[i + 1].startTime);
      if (gapMin >= 30) {
        gaps.push({ start: sorted[i].endTime, end: sorted[i + 1].startTime, duration: gapMin });
      }
    }

    // Gap after last log
    const lastEnd = sorted[sorted.length - 1].endTime;
    if (lastEnd < sleepTime) {
      const gapMin = minutesBetween(lastEnd, sleepTime);
      if (gapMin >= 30) {
        gaps.push({ start: lastEnd, end: sleepTime, duration: gapMin });
      }
    }

    return gaps;
  }

  getDailySummary(date) {
    const logs = state.getLogsForDate(date);
    const summary = {};

    for (const cat of CATEGORIES) {
      summary[cat.name] = { minutes: 0, count: 0, logs: [] };
    }

    for (const log of logs) {
      if (summary[log.category]) {
        summary[log.category].minutes += log.duration;
        summary[log.category].count++;
        summary[log.category].logs.push(log);
      }
    }

    const totalMinutes = logs.reduce((s, l) => s + l.duration, 0);
    const productiveMinutes = logs
      .filter(l => ['Deep Work', 'College'].includes(l.category))
      .reduce((s, l) => s + l.duration, 0);
    const wastedMinutes = logs
      .filter(l => ['Dopamine', 'Fake Rest', 'Avoidance'].includes(l.category))
      .reduce((s, l) => s + l.duration, 0);

    const avgMood = logs.length ? logs.reduce((s, l) => s + l.mood, 0) / logs.length : 0;
    const avgEnergy = logs.length ? logs.reduce((s, l) => s + l.energy, 0) / logs.length : 0;

    return {
      date,
      categories: summary,
      totalMinutes,
      productiveMinutes,
      wastedMinutes,
      neutralMinutes: totalMinutes - productiveMinutes - wastedMinutes,
      logCount: logs.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      gaps: this.detectGaps(date),
    };
  }

  getSuggestedActivity() {
    const hour = new Date().getHours();
    const logs = state.get('logs');
    
    // Find most common activity at this hour
    const hourLogs = logs.filter(l => {
      const h = parseInt(l.startTime.split(':')[0]);
      return Math.abs(h - hour) <= 1;
    });

    if (hourLogs.length > 0) {
      const freq = {};
      hourLogs.forEach(l => {
        freq[l.activity] = (freq[l.activity] || 0) + 1;
      });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] || null;
    }

    return null;
  }

  getRecentActivities(limit = 10) {
    const logs = state.get('logs');
    const unique = new Map();
    for (let i = logs.length - 1; i >= 0 && unique.size < limit; i--) {
      if (!unique.has(logs[i].activity)) {
        unique.set(logs[i].activity, logs[i].category);
      }
    }
    return Array.from(unique.entries()).map(([name, category]) => ({ name, category }));
  }

  unlockAchievement(id) {
    const achievements = state.get('rewards.achievements') || [];
    if (!achievements.includes(id)) {
      achievements.push(id);
      state.set('rewards.achievements', achievements);
      events.emit(EVENTS.REWARD_UNLOCKED, { id });
      events.emit(EVENTS.TOAST_SHOW, {
        type: 'success',
        title: 'Achievement Unlocked! 🏆',
        message: `You earned a new achievement!`
      });
    }
  }

  checkAllCategoriesAchievement(date) {
    const logs = state.getLogsForDate(date);
    const categories = new Set(logs.map(l => l.category));
    if (categories.size >= 8) {
      this.unlockAchievement('all_categories');
    }
  }
}

export const collector = new DataCollector();

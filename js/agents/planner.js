// ============================================
// STD TIME TRACKER — Agent 3: Planner
// ============================================

import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';
import { today, daysBetween, formatDuration, daysAgo, getWeekDates } from '../core/utils.js';
import { collector } from './collector.js';
import { analyzer } from './analyzer.js';
import { CATEGORIES } from '../data/categories.js';

class Planner {
  generateDailyPlan(date = null) {
    date = date || today();
    const user = state.get('user');
    if (!user) return null;

    const wakeTime = user.wakeTime || '07:00';
    const sleepTime = user.sleepTime || '23:00';
    const goals = state.get('goals') || [];
    const analysis = analyzer.analyzeDay(daysAgo(1)); // Use yesterday's analysis
    const plan = [];

    const wakeHour = parseInt(wakeTime.split(':')[0]);
    const wakeMin = parseInt(wakeTime.split(':')[1]) || 0;
    const sleepHour = parseInt(sleepTime.split(':')[0]);
    
    let currentHour = wakeHour;
    let currentMin = wakeMin;

    const addBlock = (activity, category, durationMin, priority = 'normal') => {
      const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      currentMin += durationMin;
      while (currentMin >= 60) {
        currentHour++;
        currentMin -= 60;
      }
      const endTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      plan.push({
        activity,
        category,
        startTime,
        endTime,
        duration: durationMin,
        completed: false,
        priority,
      });
    };

    const addBuffer = (minutes = 15) => {
      currentMin += minutes;
      while (currentMin >= 60) {
        currentHour++;
        currentMin -= 60;
      }
    };

    // --- Morning Routine ---
    addBlock('Morning Routine (shower, breakfast)', 'Maintenance', 45);
    addBuffer(15);

    // --- Morning Deep Work Block 1 ---
    addBlock('Deep Work — Focus Session 1', 'Deep Work', 90, 'high');
    addBuffer(10);

    // --- Short Break ---
    addBlock('Strategic Break (walk, stretch)', 'Good Rest', 15);
    addBuffer(5);

    // --- Morning Deep Work Block 2 ---
    addBlock('Deep Work — Focus Session 2', 'Deep Work', 60, 'high');
    addBuffer(10);

    // --- Lunch ---
    addBlock('Lunch Break', 'Maintenance', 45);
    addBuffer(15);

    // --- Afternoon ---
    if (this.hasMorningBlock(currentHour)) {
      // College block if applicable
      addBlock('College / Classes', 'College', 120);
      addBuffer(15);
    } else {
      addBlock('Deep Work — Focus Session 3', 'Deep Work', 75, 'high');
      addBuffer(10);
      addBlock('Active Break (exercise, walk)', 'Good Rest', 30);
      addBuffer(10);
    }

    // --- Late Afternoon ---
    addBlock('Review & Light Tasks', 'Deep Work', 45);
    addBuffer(10);

    // --- Evening ---
    addBlock('Exercise / Sports / Hobby', 'Good Rest', 45);
    addBuffer(10);
    addBlock('Dinner', 'Maintenance', 40);
    addBuffer(15);

    // --- Evening Study ---
    addBlock('Evening Study Session', 'Deep Work', 60, 'high');
    addBuffer(10);

    // --- Wind Down ---
    const remainingMin = (sleepHour - currentHour) * 60 - currentMin;
    if (remainingMin > 30) {
      const socialTime = Math.min(45, remainingMin - 30);
      addBlock('Social / Free Time (budgeted)', 'Social', socialTime);
      addBuffer(10);
    }

    // --- Plan reflects sleep ---
    addBlock('Wind Down & Sleep Prep', 'Good Rest', 30);

    // Customize based on goals
    this.applyGoalCustomization(plan, goals);

    // Store plan
    state.setPlanForDate(date, plan);

    // Check achievement
    const achievements = state.get('rewards.achievements') || [];
    if (!achievements.includes('first_plan')) {
      collector.unlockAchievement('first_plan');
    }

    return plan;
  }

  hasMorningBlock(currentHour) {
    return currentHour < 14;
  }

  applyGoalCustomization(plan, goals) {
    // Replace generic "Deep Work" labels with specific goal activities
    const activeGoals = goals.filter(g => g.progress < 100);
    let deepWorkBlocks = plan.filter(b => b.category === 'Deep Work');

    activeGoals.forEach((goal, idx) => {
      if (idx < deepWorkBlocks.length) {
        deepWorkBlocks[idx].activity = `${goal.title} (Goal Focus)`;
      }
    });
  }

  generateWeeklyRoadmap() {
    const dates = getWeekDates();
    const roadmap = {};

    dates.forEach(date => {
      const existing = state.get('plans')?.[date];
      if (existing && existing.length > 0) {
        roadmap[date] = existing;
      } else {
        roadmap[date] = this.generateDailyPlan(date);
      }
    });

    return roadmap;
  }

  getRecoverableTime(date = null) {
    date = date || daysAgo(1);
    const summary = collector.getDailySummary(date);
    const recoverable = [];

    const wasteCategories = ['Dopamine', 'Fake Rest', 'Avoidance'];
    wasteCategories.forEach(cat => {
      const minutes = summary.categories[cat]?.minutes || 0;
      if (minutes >= 30) {
        const recoverMin = Math.round(minutes * 0.6); // Aim to recover 60%
        recoverable.push({
          category: cat,
          currentMinutes: minutes,
          recoverableMinutes: recoverMin,
          suggestion: this.getRecoverySuggestion(cat, recoverMin),
        });
      }
    });

    return {
      totalRecoverable: recoverable.reduce((s, r) => s + r.recoverableMinutes, 0),
      items: recoverable,
    };
  }

  getRecoverySuggestion(category, minutes) {
    const suggestions = {
      'Dopamine': [
        `Replace ${formatDuration(minutes)} of scrolling with a focused study session`,
        `Set a phone-free block during this time. Use Do Not Disturb.`,
        `Schedule a walk or exercise instead of reaching for your phone`,
      ],
      'Fake Rest': [
        `If you need rest, take an actual 20-min power nap instead of ${formatDuration(minutes)} of bed-scrolling`,
        `Replace lying-in-bed time with meditation or light stretching`,
        `Get up immediately when you feel the urge to "just lie down for a bit"`,
      ],
      'Avoidance': [
        `Use the 2-minute rule: just start the task for 2 minutes. ${formatDuration(minutes)} of overthinking can become action.`,
        `Break your task into the smallest possible first step`,
        `Set a 25-minute timer and commit to just one block of focused work`,
      ],
    };

    const pool = suggestions[category] || ['Reduce this time and replace with deep work'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  calculateDailyEffort(goal) {
    if (!goal.deadline) return null;
    
    const daysRemaining = daysBetween(today(), goal.deadline);
    if (daysRemaining <= 0) return { overdue: true, daysOverdue: Math.abs(daysRemaining) };

    const remainingProgress = 100 - (goal.progress || 0);
    const dailyPercent = remainingProgress / daysRemaining;
    const dailyHours = (goal.dailyEffort || 2) * (dailyPercent / 100);

    return {
      daysRemaining,
      remainingProgress,
      dailyPercent: Math.round(dailyPercent * 10) / 10,
      dailyHours: Math.round(dailyHours * 10) / 10,
      onTrack: dailyPercent <= 5,
      urgent: daysRemaining <= 7,
    };
  }

  suggestHabitChanges() {
    const userType = analyzer.classifyUserType();
    const suggestions = [];
    
    // General suggestions based on data
    const weekAnalysis = analyzer.analyzeWeek();
    
    if (weekAnalysis.avgWasted > weekAnalysis.avgProductive) {
      suggestions.push({
        priority: 'high',
        title: 'You waste more time than you invest',
        action: 'Start each day with 1 hour of deep work BEFORE touching your phone',
        impact: `Could recover ${formatDuration(weekAnalysis.avgWasted * 0.4)} daily`,
      });
    }

    if (weekAnalysis.avgProductive < 120) {
      suggestions.push({
        priority: 'high',
        title: 'Deep work is critically low',
        action: 'Block 2 hours of uninterrupted focus time every morning',
        impact: 'Even 2 focused hours beats 6 distracted hours',
      });
    }

    // User-type specific
    if (userType) {
      const typeData = INSIGHTS.userTypes[userType];
      if (typeData?.fixSuggestions) {
        typeData.fixSuggestions.forEach((fix, idx) => {
          suggestions.push({
            priority: idx === 0 ? 'high' : 'medium',
            title: `${userType} Fix #${idx + 1}`,
            action: fix,
            impact: 'Behavioral pattern correction',
          });
        });
      }
    }

    return suggestions;
  }

  getRecoveryPlan(date) {
    // After a bad day (compliance < 30%), generate a lighter recovery plan
    const plan = [];
    const user = state.get('user');
    const wakeTime = user?.wakeTime || '07:00';

    plan.push({
      activity: '🌅 Win the Morning: Just 30 min of focused work',
      category: 'Deep Work',
      duration: 30,
      priority: 'high',
      note: 'The goal today is ONE good hour. That\'s it.',
    });

    plan.push({
      activity: '🧘 15 min walk or stretch (no phone)',
      category: 'Good Rest',
      duration: 15,
      priority: 'medium',
    });

    plan.push({
      activity: '📖 One more 25-min focus session',
      category: 'Deep Work',
      duration: 25,
      priority: 'medium',
      note: 'If you do this, you\'ve already beaten yesterday.',
    });

    return {
      type: 'recovery',
      message: 'Yesterday was tough. Today\'s plan is intentionally light. Win ONE hour and rebuild from there.',
      plan,
    };
  }
}

export const planner = new Planner();

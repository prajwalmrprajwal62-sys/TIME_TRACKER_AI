// ============================================
// STD TIME TRACKER — Agent 4: Enforcer
// ============================================

import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';
import { today, daysAgo, formatDuration, mean } from '../core/utils.js';
import { collector } from './collector.js';
import { XP_RULES, ACHIEVEMENTS, getComplianceFeedback, REAL_WORLD_REWARDS } from '../data/rewards-bank.js';
import { getProductiveCategories, getWastedCategories } from '../data/categories.js';

class Enforcer {
  calculateCompliance(date = null) {
    date = date || today();
    const plan = state.get('plans')?.[date];
    const logs = state.getLogsForDate(date);

    if (!plan || plan.length === 0) {
      // No plan exists – calculate based on productive vs wasted ratio
      const summary = collector.getDailySummary(date);
      if (summary.logCount === 0) return { score: 0, hasLogs: false, hasPlan: false };
      
      const prodRatio = summary.totalMinutes > 0 
        ? (summary.productiveMinutes / summary.totalMinutes) * 100 
        : 0;
      return {
        score: Math.round(prodRatio),
        hasPlan: false,
        hasLogs: true,
        productive: summary.productiveMinutes,
        wasted: summary.wastedMinutes,
      };
    }

    // Compare plan vs actual
    let matchedBlocks = 0;
    let totalBlocks = plan.length;
    const deviations = [];

    for (const block of plan) {
      const matchingLog = logs.find(log => {
        const categoryMatch = log.category === block.category;
        const timeClose = this.isTimeClose(log.startTime, block.startTime, 30);
        return categoryMatch && timeClose;
      });

      if (matchingLog) {
        matchedBlocks++;
        block.completed = true;
      } else {
        // Find what actually happened during this time slot
        const actualLog = logs.find(log => this.isTimeClose(log.startTime, block.startTime, 30));
        deviations.push({
          planned: block.activity,
          plannedCategory: block.category,
          actual: actualLog?.activity || 'Nothing logged',
          actualCategory: actualLog?.category || 'Untracked',
          time: block.startTime,
        });
      }
    }

    const score = totalBlocks > 0 ? Math.round((matchedBlocks / totalBlocks) * 100) : 0;

    return {
      score,
      hasPlan: true,
      hasLogs: logs.length > 0,
      matched: matchedBlocks,
      total: totalBlocks,
      deviations,
      productive: collector.getDailySummary(date).productiveMinutes,
      wasted: collector.getDailySummary(date).wastedMinutes,
    };
  }

  isTimeClose(time1, time2, thresholdMinutes) {
    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return Math.abs(toMin(time1) - toMin(time2)) <= thresholdMinutes;
  }

  detectLazinessPatterns(days = 7) {
    const patterns = [];
    const complianceScores = [];
    const skippedActivities = {};
    const weakDays = [];

    for (let i = 0; i < days; i++) {
      const date = daysAgo(i);
      const compliance = this.calculateCompliance(date);
      complianceScores.push(compliance.score);

      if (compliance.score < 50) {
        weakDays.push(date);
      }

      if (compliance.deviations) {
        compliance.deviations.forEach(d => {
          const key = d.planned;
          skippedActivities[key] = (skippedActivities[key] || 0) + 1;
        });
      }
    }

    // Find consistently skipped activities
    for (const [activity, count] of Object.entries(skippedActivities)) {
      if (count >= 3) {
        patterns.push({
          type: 'consistently_skipped',
          message: `You've skipped "${activity}" ${count} of the last ${days} days.`,
          severity: count >= 5 ? 'high' : 'medium',
        });
      }
    }

    // Declining trend
    if (complianceScores.length >= 3) {
      const recentAvg = mean(complianceScores.slice(0, 3));
      const olderAvg = mean(complianceScores.slice(3));
      if (olderAvg > 0 && recentAvg < olderAvg * 0.7) {
        patterns.push({
          type: 'declining',
          message: `Your compliance is declining: ${Math.round(olderAvg)}% → ${Math.round(recentAvg)}%. You're losing grip.`,
          severity: 'high',
        });
      }
    }

    // Weekend drops
    const weekendScores = [];
    const weekdayScores = [];
    for (let i = 0; i < days; i++) {
      const date = daysAgo(i);
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      const score = complianceScores[i];
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendScores.push(score);
      } else {
        weekdayScores.push(score);
      }
    }
    if (weekendScores.length > 0 && weekdayScores.length > 0) {
      const weekendAvg = mean(weekendScores);
      const weekdayAvg = mean(weekdayScores);
      if (weekdayAvg > 0 && weekendAvg < weekdayAvg * 0.6) {
        patterns.push({
          type: 'weekend_drop',
          message: `Weekends are your blind spot. Average compliance: ${Math.round(weekendAvg)}% vs ${Math.round(weekdayAvg)}% weekdays.`,
          severity: 'medium',
        });
      }
    }

    return patterns;
  }

  generateFeedback(date = null) {
    date = date || today();
    const compliance = this.calculateCompliance(date);
    const { tier, message } = getComplianceFeedback(compliance.score);
    
    return {
      score: compliance.score,
      tier,
      message,
      deviations: compliance.deviations || [],
      lazinessPatterns: this.detectLazinessPatterns(),
    };
  }

  processEndOfDay(date = null) {
    date = date || today();
    const compliance = this.calculateCompliance(date);
    
    // Award XP
    this.awardDailyXP(date, compliance);
    
    // Update streak
    this.updateStreak(date, compliance.score);
    
    // Check achievements
    this.checkAchievements(date, compliance);
    
    // Emit compliance update
    events.emit(EVENTS.COMPLIANCE_UPDATED, { date, compliance });

    return compliance;
  }

  awardDailyXP(date, compliance) {
    const summary = collector.getDailySummary(date);
    let xp = 0;

    // XP for productive work
    const deepWorkHours = (summary.categories['Deep Work']?.minutes || 0) / 60;
    xp += Math.round(deepWorkHours * XP_RULES.deepWorkHour);

    const collegeHours = (summary.categories['College']?.minutes || 0) / 60;
    xp += Math.round(collegeHours * XP_RULES.collegeHour);

    const goodRestHours = (summary.categories['Good Rest']?.minutes || 0) / 60;
    xp += Math.round(goodRestHours * XP_RULES.goodRestHour);

    // Compliance bonuses
    if (compliance.score >= 90) xp += XP_RULES.planCompliance90;
    else if (compliance.score >= 70) xp += XP_RULES.planCompliance70;

    // Penalties
    const dopamineHours = (summary.categories['Dopamine']?.minutes || 0) / 60;
    if (dopamineHours > 2) {
      xp += Math.round((dopamineHours - 2) * XP_RULES.dopaminePenalty);
    }

    const fakeRestHours = (summary.categories['Fake Rest']?.minutes || 0) / 60;
    xp += Math.round(fakeRestHours * XP_RULES.fakeRestPenalty);

    // Don't go below 0 for the day
    xp = Math.max(0, xp);

    if (xp > 0) {
      state.addXP(xp);
    }

    return xp;
  }

  updateStreak(date, complianceScore) {
    const streaks = state.get('streaks');
    const history = streaks.history || [];
    
    // Add today's entry
    const existingIdx = history.findIndex(h => h.date === date);
    if (existingIdx >= 0) {
      history[existingIdx].compliance = complianceScore;
    } else {
      history.push({ date, compliance: complianceScore });
    }

    // Sort by date
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate current streak (consecutive days with >50% compliance)
    let currentStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].compliance >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }

    const bestStreak = Math.max(streaks.best || 0, currentStreak);

    state.set('streaks', {
      current: currentStreak,
      best: bestStreak,
      history,
    });

    // Streak XP
    if (complianceScore >= 50) {
      state.addXP(XP_RULES.streakDay);
    }

    // Streak milestones
    if (currentStreak === 7) {
      state.addXP(XP_RULES.streak7Day);
      collector.unlockAchievement('streak_7');
    }
    if (currentStreak === 14) {
      state.addXP(XP_RULES.streak14Day);
      collector.unlockAchievement('streak_14');
    }
    if (currentStreak === 30) {
      state.addXP(XP_RULES.streak30Day);
      collector.unlockAchievement('streak_30');
    }
    if (currentStreak === 3) collector.unlockAchievement('streak_3');
    if (currentStreak === 60) collector.unlockAchievement('streak_60');
    if (currentStreak === 100) collector.unlockAchievement('streak_100');

    events.emit(EVENTS.STREAK_UPDATED, { current: currentStreak, best: bestStreak });
  }

  checkAchievements(date, compliance) {
    const summary = collector.getDailySummary(date);
    
    // Deep work achievements
    const dwMinutes = summary.categories['Deep Work']?.minutes || 0;
    if (dwMinutes >= 240) collector.unlockAchievement('dw_4hrs');
    if (dwMinutes >= 360) collector.unlockAchievement('dw_6hrs');
    if (dwMinutes >= 480) collector.unlockAchievement('dw_8hrs');

    // Compliance achievements
    if (compliance.score >= 90) collector.unlockAchievement('comply_90');
    if (compliance.score >= 100) collector.unlockAchievement('comply_100');

    // Comeback achievement
    const yesterday = this.calculateCompliance(daysAgo(1));
    if (yesterday.score < 30 && compliance.score >= 70) {
      collector.unlockAchievement('comeback');
    }

    // Dopamine detox
    const dopamineMin = summary.categories['Dopamine']?.minutes || 0;
    if (dopamineMin === 0 && summary.logCount >= 3) {
      collector.unlockAchievement('zero_dopamine');
    }

    // Early bird
    const logs = state.getLogsForDate(date);
    const earlyDeepWork = logs.find(l => 
      l.category === 'Deep Work' && parseInt(l.startTime.split(':')[0]) < 8
    );
    if (earlyDeepWork) collector.unlockAchievement('early_bird');

    // Level achievements
    const level = state.get('rewards.level');
    if (level >= 5) collector.unlockAchievement('level_5');
    if (level >= 8) collector.unlockAchievement('level_8');
    if (level >= 10) collector.unlockAchievement('level_10');

    // Weekly deep work achievements
    let weekDW = 0;
    for (let i = 0; i < 7; i++) {
      const s = collector.getDailySummary(daysAgo(i));
      weekDW += s.categories['Deep Work']?.minutes || 0;
    }
    if (weekDW >= 1200) collector.unlockAchievement('dw_week_20');
    if (weekDW >= 2100) collector.unlockAchievement('dw_week_35');
  }

  suggestNextDayAdjustments(date = null) {
    date = date || today();
    const compliance = this.calculateCompliance(date);
    const suggestions = [];

    if (compliance.score >= 90) {
      suggestions.push({
        type: 'increase',
        message: 'You\'re crushing it. Let\'s add 30 more minutes of deep work tomorrow.',
      });
    } else if (compliance.score < 30) {
      suggestions.push({
        type: 'recovery',
        message: 'Tomorrow is a recovery day. Focus on just ONE 30-minute deep work session.',
      });
    } else if (compliance.score < 50) {
      suggestions.push({
        type: 'simplify',
        message: 'Simplifying tomorrow\'s plan. Fewer blocks, more realistic goals.',
      });
    }

    // Specific deviation-based suggestions
    if (compliance.deviations) {
      const wasteInPlanTime = compliance.deviations.filter(d => 
        ['Dopamine', 'Fake Rest'].includes(d.actualCategory)
      );
      if (wasteInPlanTime.length > 0) {
        suggestions.push({
          type: 'phone_block',
          message: `You replaced planned work with phone time ${wasteInPlanTime.length} times. Tomorrow: phone in another room during work blocks.`,
        });
      }
    }

    return suggestions;
  }

  getRewardStatus() {
    const streak = state.get('streaks.current') || 0;
    const achievements = state.get('rewards.achievements') || [];
    
    const rewards = REAL_WORLD_REWARDS.map(reward => ({
      ...reward,
      unlocked: streak >= reward.streakRequired,
      progress: Math.min(100, Math.round((streak / reward.streakRequired) * 100)),
    }));

    return {
      currentStreak: streak,
      bestStreak: state.get('streaks.best') || 0,
      xp: state.get('rewards.xp') || 0,
      level: state.get('rewards.level') || 1,
      levelName: state.get('rewards.levelName') || 'Novice',
      achievements: achievements.length,
      totalAchievements: ACHIEVEMENTS.length,
      rewards,
    };
  }

  getWeeklyComplianceHistory() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = daysAgo(i);
      const compliance = this.calculateCompliance(date);
      data.push({
        date,
        score: compliance.score,
        hasData: compliance.hasLogs,
      });
    }
    return data;
  }
}

export const enforcer = new Enforcer();

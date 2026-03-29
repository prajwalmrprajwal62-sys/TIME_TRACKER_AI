// ============================================
// STD TIME TRACKER — Agent 2: Analyzer
// ============================================

import { state } from '../core/state.js';
import { events, EVENTS } from '../core/events.js';
import { today, daysAgo, minutesBetween, mean, sum, trend, formatHours, formatDuration, getWeekDates } from '../core/utils.js';
import { collector } from './collector.js';
import { CATEGORIES, getWastedCategories, getProductiveCategories } from '../data/categories.js';
import { INSIGHTS, getRandomInsight, interpolateInsight } from '../data/insights-bank.js';

class Analyzer {
  analyzeDay(date) {
    const summary = collector.getDailySummary(date);
    const patterns = this.detectDayPatterns(date, summary);
    const insights = this.generateDayInsights(summary, patterns);
    
    return {
      summary,
      patterns,
      insights,
      userType: this.classifyUserType(),
    };
  }

  analyzeWeek(endDate = null) {
    const dates = getWeekDates(endDate);
    const dailySummaries = dates.map(d => collector.getDailySummary(d));
    
    const weeklyTotals = {};
    CATEGORIES.forEach(c => { weeklyTotals[c.name] = 0; });
    
    dailySummaries.forEach(s => {
      Object.entries(s.categories).forEach(([cat, data]) => {
        weeklyTotals[cat] = (weeklyTotals[cat] || 0) + data.minutes;
      });
    });

    const productiveMinutes = dailySummaries.map(s => s.productiveMinutes);
    const wastedMinutes = dailySummaries.map(s => s.wastedMinutes);
    const totalProductive = sum(productiveMinutes);
    const totalWasted = sum(wastedMinutes);

    return {
      dates,
      dailySummaries,
      weeklyTotals,
      totalProductive,
      totalWasted,
      avgProductive: Math.round(mean(productiveMinutes)),
      avgWasted: Math.round(mean(wastedMinutes)),
      productivityTrend: trend(productiveMinutes),
      bestDay: dates[productiveMinutes.indexOf(Math.max(...productiveMinutes))],
      worstDay: dates[wastedMinutes.indexOf(Math.max(...wastedMinutes))],
    };
  }

  detectDayPatterns(date, summary) {
    const logs = state.getLogsForDate(date);
    const patterns = {
      mostWastedCategory: null,
      weakestTimeSlot: null,
      triggers: [],
      productiveSlots: [],
    };

    // Most wasted category
    const wastedCats = getWastedCategories();
    let maxWaste = 0;
    for (const cat of wastedCats) {
      if (summary.categories[cat]?.minutes > maxWaste) {
        maxWaste = summary.categories[cat].minutes;
        patterns.mostWastedCategory = cat;
      }
    }

    // Analyze time slots
    const slots = {
      'Morning (6-12)': { productive: 0, wasted: 0, total: 0 },
      'Afternoon (12-17)': { productive: 0, wasted: 0, total: 0 },
      'Evening (17-21)': { productive: 0, wasted: 0, total: 0 },
      'Night (21-6)': { productive: 0, wasted: 0, total: 0 },
    };

    logs.forEach(log => {
      const hour = parseInt(log.startTime.split(':')[0]);
      let slot;
      if (hour >= 6 && hour < 12) slot = 'Morning (6-12)';
      else if (hour >= 12 && hour < 17) slot = 'Afternoon (12-17)';
      else if (hour >= 17 && hour < 21) slot = 'Evening (17-21)';
      else slot = 'Night (21-6)';

      slots[slot].total += log.duration;
      if (getProductiveCategories().includes(log.category)) {
        slots[slot].productive += log.duration;
      } else if (getWastedCategories().includes(log.category)) {
        slots[slot].wasted += log.duration;
      }
    });

    // Weakest slot (highest waste ratio)
    let worstRatio = -1;
    for (const [name, data] of Object.entries(slots)) {
      if (data.total > 0) {
        const wasteRatio = data.wasted / data.total;
        if (wasteRatio > worstRatio) {
          worstRatio = wasteRatio;
          patterns.weakestTimeSlot = name;
        }
      }
    }

    // Best productive slots
    for (const [name, data] of Object.entries(slots)) {
      if (data.productive >= 60) {
        patterns.productiveSlots.push({ name, minutes: data.productive });
      }
    }

    patterns.timeSlots = slots;

    // Detect triggers (activity before dopamine/waste)
    for (let i = 1; i < logs.length; i++) {
      if (getWastedCategories().includes(logs[i].category) && 
          !getWastedCategories().includes(logs[i-1].category)) {
        patterns.triggers.push({
          trigger: logs[i-1].activity,
          response: logs[i].activity,
          time: logs[i].startTime,
        });
      }
    }

    return patterns;
  }

  correlateSleepProductivity(days = 14) {
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = daysAgo(i);
      const summary = collector.getDailySummary(date);
      const sleepMinutes = summary.categories['Good Rest']?.minutes || 0;
      const deepWorkMinutes = summary.categories['Deep Work']?.minutes || 0;
      if (summary.logCount > 0) {
        data.push({ date, sleep: sleepMinutes, deepWork: deepWorkMinutes });
      }
    }
    return data;
  }

  correlateMoodDistraction(days = 14) {
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = daysAgo(i);
      const summary = collector.getDailySummary(date);
      if (summary.logCount > 0) {
        data.push({
          date,
          mood: summary.avgMood,
          dopamine: summary.categories['Dopamine']?.minutes || 0,
        });
      }
    }
    return data;
  }

  classifyUserType() {
    const days = 7;
    const summaries = [];
    for (let i = 0; i < days; i++) {
      const s = collector.getDailySummary(daysAgo(i));
      if (s.logCount > 0) summaries.push(s);
    }

    if (summaries.length < 3) return null;

    const avgDopamine = mean(summaries.map(s => s.categories['Dopamine'].minutes));
    const avgDeepWork = mean(summaries.map(s => s.categories['Deep Work'].minutes));
    const avgFakeRest = mean(summaries.map(s => s.categories['Fake Rest'].minutes));
    const avgAvoidance = mean(summaries.map(s => s.categories['Avoidance'].minutes));
    const avgSleep = mean(summaries.map(s => s.categories['Good Rest'].minutes));
    const avgProductive = mean(summaries.map(s => s.productiveMinutes));
    const avgTotal = mean(summaries.map(s => s.totalMinutes));
    const productiveStd = this.stdDev(summaries.map(s => s.productiveMinutes));

    // Classification logic
    if (avgDopamine >= 180) return 'Dopamine Addict';
    
    // Night waster: check if most activity is after 9pm and low productivity
    const nightLogs = state.get('logs').filter(l => {
      const h = parseInt(l.startTime.split(':')[0]);
      return h >= 21 || h < 6;
    });
    if (nightLogs.length > state.get('logs').length * 0.4 && avgDeepWork < 120) {
      return 'Night Waster';
    }

    if (avgAvoidance + avgFakeRest >= avgDeepWork && avgAvoidance >= 60) return 'Overthinker';
    if (avgTotal >= 480 && avgDeepWork < 90) return 'Busy but Unproductive';
    if (productiveStd > avgProductive * 0.6) return 'Inconsistent Performer';
    if (avgSleep < 300 && summaries.length >= 5) return 'Sleep-Deprived Warrior';

    return null; // No clear pattern yet
  }

  stdDev(arr) {
    const avg = mean(arr);
    const squareDiffs = arr.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(mean(squareDiffs));
  }

  generateDayInsights(summary, patterns) {
    const insights = [];

    // Dopamine insights
    const dopamineHours = (summary.categories['Dopamine']?.minutes || 0) / 60;
    if (dopamineHours >= 1) {
      const severity = dopamineHours >= 4 ? 'brutal' : dopamineHours >= 2 ? 'moderate' : 'mild';
      const template = getRandomInsight('dopamine', severity);
      if (template) {
        insights.push({
          category: 'Dopamine',
          severity,
          text: interpolateInsight(template, {
            hours: formatDuration(summary.categories['Dopamine'].minutes),
            percent: Math.round((summary.categories['Dopamine'].minutes / summary.totalMinutes) * 100),
            weeklyHours: formatHours(dopamineHours * 7 * 60),
            monthlyHours: formatHours(dopamineHours * 30 * 60),
            yearlyHours: formatHours(dopamineHours * 365 * 60),
          })
        });
      }
    }

    // Fake Rest insights
    const fakeRestHours = (summary.categories['Fake Rest']?.minutes || 0) / 60;
    if (fakeRestHours >= 0.5) {
      const severity = fakeRestHours >= 2 ? 'brutal' : fakeRestHours >= 1 ? 'moderate' : 'mild';
      const template = getRandomInsight('fakeRest', severity);
      if (template) {
        insights.push({
          category: 'Fake Rest',
          severity,
          text: interpolateInsight(template, {
            hours: formatDuration(summary.categories['Fake Rest'].minutes),
          })
        });
      }
    }

    // Avoidance insights
    const avoidHours = (summary.categories['Avoidance']?.minutes || 0) / 60;
    if (avoidHours >= 0.5) {
      const severity = avoidHours >= 2 ? 'brutal' : avoidHours >= 1 ? 'moderate' : 'mild';
      const template = getRandomInsight('avoidance', severity);
      if (template) {
        insights.push({
          category: 'Avoidance',
          severity,
          text: interpolateInsight(template, {
            hours: formatDuration(summary.categories['Avoidance'].minutes),
          })
        });
      }
    }

    // Productivity insights
    const deepWorkHours = (summary.categories['Deep Work']?.minutes || 0) / 60;
    const weekAvg = this.getWeeklyAvgDeepWork();
    if (summary.logCount > 0) {
      let severity;
      if (deepWorkHours >= 4 && deepWorkHours > weekAvg * 1.2) severity = 'excellent';
      else if (deepWorkHours > weekAvg) severity = 'improving';
      else severity = 'low';
      
      const template = getRandomInsight('productivity', severity);
      if (template) {
        const wastedMin = summary.wastedMinutes;
        const ratio = wastedMin > 0 ? (summary.productiveMinutes / wastedMin).toFixed(1) : '∞';
        insights.push({
          category: 'Productivity',
          severity,
          text: interpolateInsight(template, {
            hours: formatDuration(summary.productiveMinutes),
            percent: summary.totalMinutes > 0 ? Math.round((summary.productiveMinutes / summary.totalMinutes) * 100) : 0,
            change: weekAvg > 0 ? Math.round(((deepWorkHours - weekAvg) / weekAvg) * 100) : 0,
            wastedHours: formatDuration(wastedMin),
            ratio,
            wasteMinutes: wastedMin > 0 ? Math.round(wastedMin / summary.productiveMinutes) : 0,
            daysNeeded: 365,
          })
        });
      }
    }

    // Weak time slot insight
    if (patterns.weakestTimeSlot && patterns.timeSlots) {
      const slotData = patterns.timeSlots[patterns.weakestTimeSlot];
      if (slotData && slotData.total > 0) {
        const topWasteActivity = this.getTopWasteActivityInSlot(summary.date, patterns.weakestTimeSlot);
        insights.push({
          category: 'Pattern',
          severity: 'moderate',
          text: `⚠️ Your weakest time slot is ${patterns.weakestTimeSlot}. ${Math.round((slotData.wasted / slotData.total) * 100)}% of that time was wasted${topWasteActivity ? ` — mostly on ${topWasteActivity}` : ''}.`,
        });
      }
    }

    // Trigger insights
    if (patterns.triggers.length > 0) {
      const trigger = patterns.triggers[0];
      insights.push({
        category: 'Trigger',
        severity: 'moderate',
        text: `🔍 Trigger detected: After "${trigger.trigger}" you switched to "${trigger.response}" at ${trigger.time}. This pattern is costing you focus.`,
      });
    }

    return insights;
  }

  getWeeklyAvgDeepWork() {
    let total = 0, count = 0;
    for (let i = 0; i < 7; i++) {
      const s = collector.getDailySummary(daysAgo(i));
      if (s.logCount > 0) {
        total += s.categories['Deep Work'].minutes;
        count++;
      }
    }
    return count > 0 ? (total / count) / 60 : 0;
  }

  getTopWasteActivityInSlot(date, slotName) {
    const logs = state.getLogsForDate(date);
    const wastedCats = getWastedCategories();
    const freq = {};
    
    logs.forEach(log => {
      if (!wastedCats.includes(log.category)) return;
      const hour = parseInt(log.startTime.split(':')[0]);
      let slot;
      if (hour >= 6 && hour < 12) slot = 'Morning (6-12)';
      else if (hour >= 12 && hour < 17) slot = 'Afternoon (12-17)';
      else if (hour >= 17 && hour < 21) slot = 'Evening (17-21)';
      else slot = 'Night (21-6)';

      if (slot === slotName) {
        freq[log.activity] = (freq[log.activity] || 0) + log.duration;
      }
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  }

  getProductivityHeatmap(days = 28) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = daysAgo(i);
      const summary = collector.getDailySummary(date);
      data.push({
        date,
        productive: summary.productiveMinutes,
        wasted: summary.wastedMinutes,
        total: summary.totalMinutes,
        level: this.getHeatmapLevel(summary.productiveMinutes),
      });
    }
    return data;
  }

  getHeatmapLevel(productiveMinutes) {
    if (productiveMinutes === 0) return 0;
    if (productiveMinutes < 60) return 1;
    if (productiveMinutes < 180) return 2;
    if (productiveMinutes < 300) return 3;
    return 4;
  }

  getHourlyBreakdown(date) {
    const logs = state.getLogsForDate(date);
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      categories: {},
      total: 0,
    }));

    logs.forEach(log => {
      const startH = parseInt(log.startTime.split(':')[0]);
      const endH = parseInt(log.endTime.split(':')[0]);
      for (let h = startH; h <= endH && h < 24; h++) {
        if (!hours[h].categories[log.category]) {
          hours[h].categories[log.category] = 0;
        }
        hours[h].categories[log.category] += Math.min(60, log.duration);
        hours[h].total += Math.min(60, log.duration);
      }
    });

    return hours;
  }

  runFullAnalysis() {
    const todayAnalysis = this.analyzeDay(today());
    const weekAnalysis = this.analyzeWeek();
    const userType = this.classifyUserType();

    state.set('analysis.userType', userType);
    state.set('analysis.lastAnalysis', new Date().toISOString());
    state.set('analysis.patterns', {
      weeklyProductivity: weekAnalysis.totalProductive,
      weeklyWaste: weekAnalysis.totalWasted,
      trend: weekAnalysis.productivityTrend,
    });

    events.emit(EVENTS.ANALYSIS_COMPLETE, {
      today: todayAnalysis,
      week: weekAnalysis,
      userType,
    });

    return { today: todayAnalysis, week: weekAnalysis, userType };
  }
}

export const analyzer = new Analyzer();

// ============================================
// TimeForge — SDG 8 Benchmark Data & Scoring
// ============================================
// SDG 8: Decent Work and Economic Growth
// Target 8.5: Full & productive employment for all

export const SDG_TARGETS = {
  '8.5': {
    name: 'Full and productive employment',
    description: 'Achieve full and productive employment and decent work for all',
    indicator: 'Average productive hours per day',
    yourContribution: (deepWorkHours) =>
      `${deepWorkHours.toFixed(1)}h/day productive time — ${deepWorkHours >= 4 ? 'exceeding' : deepWorkHours >= 2.5 ? 'meeting' : 'below'} sustainable productivity targets`,
  },
  '8.8': {
    name: 'Safe working environments',
    description: 'Protect labour rights and promote safe working environments',
    indicator: 'Work-life balance score',
    yourContribution: (balanceScore) =>
      `${balanceScore}% work-life balance — ${balanceScore >= 70 ? 'healthy' : balanceScore >= 50 ? 'at risk' : 'unsustainable'} sustainability level`,
  },
};

// Simulated global benchmarks (realistic ranges based on research)
export const SDG_BENCHMARKS = {
  // Global student averages (daily)
  students: {
    deepWorkHoursDaily: 3.2,
    totalProductiveHoursDaily: 4.8,
    compliancePercent: 68,
    avgStreakDays: 4.5,
    wastedHoursDaily: 2.8,
    burnoutRiskPercent: 42,
    avgEnergyScore: 3.1,
    avgMoodScore: 3.3,
  },
  // Working professionals (daily) — for future reference
  professionals: {
    deepWorkHoursDaily: 4.5,
    totalProductiveHoursDaily: 6.2,
    compliancePercent: 74,
    avgStreakDays: 8.2,
    wastedHoursDaily: 1.9,
  },
  // SDG sustainable targets
  sustainableTargets: {
    minDeepWorkHours: 4.0,
    maxWastedHours: 1.5,
    minCompliancePercent: 80,
    minStreakDays: 7,
    healthyWorkLifeBalance: 70,
    maxScreenTimeHours: 2.0,
  },
};

// Percentile distribution tables (simulated normal distribution)
const PERCENTILE_TABLE = {
  deepWork: [
    { hours: 0.5, percentile: 10 },
    { hours: 1.0, percentile: 20 },
    { hours: 1.5, percentile: 30 },
    { hours: 2.0, percentile: 40 },
    { hours: 2.5, percentile: 48 },
    { hours: 3.0, percentile: 55 },
    { hours: 3.5, percentile: 65 },
    { hours: 4.0, percentile: 75 },
    { hours: 4.5, percentile: 82 },
    { hours: 5.0, percentile: 88 },
    { hours: 5.5, percentile: 92 },
    { hours: 6.0, percentile: 95 },
    { hours: 7.0, percentile: 98 },
  ],
  compliance: [
    { score: 20, percentile: 10 },
    { score: 35, percentile: 20 },
    { score: 45, percentile: 30 },
    { score: 55, percentile: 40 },
    { score: 65, percentile: 50 },
    { score: 72, percentile: 60 },
    { score: 78, percentile: 70 },
    { score: 85, percentile: 80 },
    { score: 90, percentile: 88 },
    { score: 95, percentile: 95 },
  ],
  streak: [
    { days: 1, percentile: 25 },
    { days: 3, percentile: 40 },
    { days: 5, percentile: 55 },
    { days: 7, percentile: 65 },
    { days: 10, percentile: 75 },
    { days: 14, percentile: 82 },
    { days: 21, percentile: 90 },
    { days: 30, percentile: 95 },
  ],
};

/**
 * Calculate the user's percentile for a given metric.
 */
export function calculatePercentile(value, metric) {
  const table = PERCENTILE_TABLE[metric];
  if (!table) return 50;

  const key = metric === 'deepWork' ? 'hours' : metric === 'compliance' ? 'score' : 'days';

  if (value <= table[0][key]) return table[0].percentile;
  if (value >= table[table.length - 1][key]) return table[table.length - 1].percentile;

  for (let i = 0; i < table.length - 1; i++) {
    if (value >= table[i][key] && value < table[i + 1][key]) {
      // Linear interpolation
      const range = table[i + 1][key] - table[i][key];
      const pRange = table[i + 1].percentile - table[i].percentile;
      const fraction = (value - table[i][key]) / range;
      return Math.round(table[i].percentile + fraction * pRange);
    }
  }
  return 50;
}

/**
 * Calculate a composite SDG 8 contribution score (0–100).
 * Weights: Deep Work (40%), Compliance (25%), Streak (20%), Low Waste (15%)
 */
export function calculateSDGScore(stats) {
  const {
    deepWorkHours = 0,
    compliancePercent = 0,
    streakDays = 0,
    wastedHours = 0,
  } = stats;

  // Normalize each metric to 0–100
  const deepWorkScore = Math.min(100, (deepWorkHours / SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours) * 100);
  const complianceScore = Math.min(100, (compliancePercent / SDG_BENCHMARKS.sustainableTargets.minCompliancePercent) * 100);
  const streakScore = Math.min(100, (streakDays / SDG_BENCHMARKS.sustainableTargets.minStreakDays) * 100);
  const wasteScore = wastedHours <= 0
    ? 100
    : Math.max(0, 100 - ((wastedHours / SDG_BENCHMARKS.sustainableTargets.maxWastedHours) * 100 - 100));

  // Weighted composite
  const composite = Math.round(
    deepWorkScore * 0.40 +
    complianceScore * 0.25 +
    streakScore * 0.20 +
    wasteScore * 0.15
  );

  return Math.min(100, Math.max(0, composite));
}

/**
 * Get the SDG contribution level label.
 */
export function getSDGLevel(score) {
  if (score >= 90) return { label: 'Champion', color: '#10b981', emoji: '🏆' };
  if (score >= 75) return { label: 'Leader', color: '#34d399', emoji: '⭐' };
  if (score >= 60) return { label: 'Contributor', color: '#3b82f6', emoji: '📈' };
  if (score >= 40) return { label: 'Developing', color: '#f59e0b', emoji: '🌱' };
  if (score >= 20) return { label: 'Emerging', color: '#f97316', emoji: '🔄' };
  return { label: 'Starting', color: '#ef4444', emoji: '🚀' };
}

/**
 * Calculate work-life balance score (0–100).
 */
export function calculateWorkLifeBalance(productiveMinutes, wastedMinutes, totalMinutes) {
  if (totalMinutes === 0) return 50;
  const productiveRatio = productiveMinutes / totalMinutes;
  const wasteRatio = wastedMinutes / totalMinutes;

  // Ideal: ~40-60% productive, <15% wasted, rest is neutral (maintenance, rest, social)
  let score = 50;
  if (productiveRatio >= 0.35 && productiveRatio <= 0.65) score += 20;
  else if (productiveRatio > 0.65) score += 5; // Overwork risk
  else score += productiveRatio * 40;

  if (wasteRatio < 0.10) score += 30;
  else if (wasteRatio < 0.20) score += 20;
  else if (wasteRatio < 0.30) score += 10;
  else score -= 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

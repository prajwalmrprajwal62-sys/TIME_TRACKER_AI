// ============================================
// STD TIME TRACKER — Rewards Bank
// ============================================

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Novice', threshold: 0, emoji: '🌱' },
  { level: 2, name: 'Beginner', threshold: 100, emoji: '🌿' },
  { level: 3, name: 'Apprentice', threshold: 300, emoji: '🌳' },
  { level: 4, name: 'Disciplined', threshold: 600, emoji: '⚡' },
  { level: 5, name: 'Focused', threshold: 1000, emoji: '🎯' },
  { level: 6, name: 'Dedicated', threshold: 1500, emoji: '💪' },
  { level: 7, name: 'Elite', threshold: 2200, emoji: '🏆' },
  { level: 8, name: 'Master', threshold: 3000, emoji: '👑' },
  { level: 9, name: 'Legendary', threshold: 4000, emoji: '🌟' },
  { level: 10, name: 'Transcendent', threshold: 5500, emoji: '🔮' },
];

export const XP_RULES = {
  deepWorkHour: 15,        // Per hour of deep work
  collegeHour: 8,          // Per hour of college
  goodRestHour: 5,         // Per hour of good rest
  planCompliance70: 20,    // Bonus for >70% daily compliance
  planCompliance90: 50,    // Bonus for >90% daily compliance
  streakDay: 10,           // Per consecutive day of >50% compliance
  streak7Day: 100,         // Bonus for 7-day streak
  streak14Day: 250,        // Bonus for 14-day streak
  streak30Day: 750,        // Bonus for 30-day streak  
  logComplete: 5,          // For logging activities (max 3 per day)
  goalProgress: 10,        // Per 10% goal completion milestone
  dopaminePenalty: -5,     // Per hour over 2hrs of dopamine
  fakeRestPenalty: -3,     // Per hour of fake rest
};

export const ACHIEVEMENTS = [
  // Getting Started
  { id: 'first_log', name: 'First Step', emoji: '👣', description: 'Log your first activity', category: 'start' },
  { id: 'first_plan', name: 'Game Plan', emoji: '📋', description: 'Generate your first daily plan', category: 'start' },
  { id: 'first_goal', name: 'Aim Set', emoji: '🏹', description: 'Create your first goal', category: 'start' },
  
  // Consistency
  { id: 'streak_3', name: 'Warming Up', emoji: '🔥', description: '3-day streak', category: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', emoji: '⚔️', description: '7-day streak', category: 'streak' },
  { id: 'streak_14', name: 'Fortnight Force', emoji: '🛡️', description: '14-day streak', category: 'streak' },
  { id: 'streak_30', name: 'Monthly Monster', emoji: '🐉', description: '30-day streak', category: 'streak' },
  { id: 'streak_60', name: 'Iron Will', emoji: '⛓️', description: '60-day streak', category: 'streak' },
  { id: 'streak_100', name: 'Centurion', emoji: '🏛️', description: '100-day streak', category: 'streak' },
  
  // Deep Work
  { id: 'dw_4hrs', name: 'Deep Diver', emoji: '🤿', description: '4+ hours of deep work in a day', category: 'work' },
  { id: 'dw_6hrs', name: 'Focus Monster', emoji: '🧠', description: '6+ hours of deep work in a day', category: 'work' },
  { id: 'dw_8hrs', name: 'Machine Mode', emoji: '🤖', description: '8+ hours of deep work in a day', category: 'work' },
  { id: 'dw_week_20', name: 'Productive Week', emoji: '📈', description: '20+ hours of deep work in a week', category: 'work' },
  { id: 'dw_week_35', name: 'Beast Week', emoji: '💪', description: '35+ hours of deep work in a week', category: 'work' },
  
  // Compliance
  { id: 'comply_90', name: 'Precision', emoji: '🎯', description: '90%+ compliance on a day', category: 'compliance' },
  { id: 'comply_100', name: 'Perfect Day', emoji: '💎', description: '100% compliance', category: 'compliance' },
  { id: 'comply_week', name: 'Week of Discipline', emoji: '🏆', description: '80%+ compliance for 7 consecutive days', category: 'compliance' },
  
  // Recovery
  { id: 'comeback', name: 'Comeback Kid', emoji: '🔄', description: 'Get 70%+ compliance after a <30% day', category: 'recovery' },
  { id: 'zero_dopamine', name: 'Dopamine Detox', emoji: '🧘', description: 'Zero dopamine time for a full day', category: 'recovery' },
  { id: 'early_bird', name: 'Early Bird', emoji: '🐦', description: 'Start deep work before 8 AM', category: 'recovery' },
  { id: 'sleep_regular', name: 'Sleep Soldier', emoji: '🛏️', description: 'Consistent 7-8hr sleep for 7 days', category: 'recovery' },
  
  // Milestones  
  { id: 'logs_50', name: 'Data Driven', emoji: '📊', description: 'Log 50 activities', category: 'milestone' },
  { id: 'logs_200', name: 'Quantified Self', emoji: '🔬', description: 'Log 200 activities', category: 'milestone' },
  { id: 'logs_500', name: 'Master Logger', emoji: '📚', description: 'Log 500 activities', category: 'milestone' },
  { id: 'level_5', name: 'Rising Star', emoji: '⭐', description: 'Reach Level 5', category: 'milestone' },
  { id: 'level_8', name: 'Elite Status', emoji: '👑', description: 'Reach Level 8', category: 'milestone' },
  { id: 'level_10', name: 'Transcendence', emoji: '🔮', description: 'Reach Level 10', category: 'milestone' },
  
  // Fun / Hidden
  { id: 'night_owl', name: 'Night Owl Reform', emoji: '🦉', description: 'Shift peak productivity from night to morning', category: 'hidden' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', emoji: '⚡', description: 'More deep work on weekend than average weekday', category: 'hidden' },
  { id: 'all_categories', name: 'Full Spectrum', emoji: '🌈', description: 'Log activities in all 8 categories in one day', category: 'hidden' },
];

export const REAL_WORLD_REWARDS = [
  { id: 'rw_1', name: 'Guilt-Free Movie Night', description: '2 hours of guilt-free entertainment', requirement: '7-day streak at 70%+ compliance', streakRequired: 7 },
  { id: 'rw_2', name: 'Cheat Day', description: 'A full day off with zero guilt', requirement: '14-day streak at 70%+ compliance', streakRequired: 14 },
  { id: 'rw_3', name: 'Treat Yourself', description: 'Buy yourself something nice (within budget)', requirement: '21-day streak at 70%+ compliance', streakRequired: 21 },
  { id: 'rw_4', name: 'Friend Hangout', description: 'Plan a special outing with friends', requirement: '30-day streak at 70%+ compliance', streakRequired: 30 },
  { id: 'rw_5', name: 'Weekend Trip', description: 'Take a short trip — you earned it', requirement: '60-day streak at 70%+ compliance', streakRequired: 60 },
];

export const COMPLIANCE_FEEDBACK = {
  excellent: [
    "Respect. You're becoming dangerous. Keep going. 🔥",
    "You executed at an elite level today. This is what discipline looks like.",
    "Near-perfect execution. Your future self is smiling right now.",
  ],
  good: [
    "Good day, but you left performance on the table. What could you tighten?",
    "Solid effort. Not perfect, but consistent. That matters more.",
    "You showed up and delivered. Push for 90%+ tomorrow.",
  ],
  mediocre: [
    "Mediocre. You know what you did. Fix it tomorrow.",
    "Average execution. You're capable of much more. What held you back?",
    "50/50 day. The question is: which side will you choose tomorrow?",
  ],
  bad: [
    "This is exactly why you're behind. No excuses. No exceptions.",
    "You gave today away. Every hour you wasted, someone else was grinding.",
    "Your plan existed. You ignored it. That's a choice — own it.",
  ],
  terrible: [
    "Complete system failure. Tomorrow is non-negotiable. Set ONE task and do it.",
    "Rock bottom? Good. Only way from here is up. But only if you choose it.",
    "Today was a write-off. Don't let it become a trend. Break the cycle NOW.",
  ]
};

export function getComplianceFeedback(score) {
  let tier;
  if (score >= 90) tier = 'excellent';
  else if (score >= 70) tier = 'good';
  else if (score >= 50) tier = 'mediocre';
  else if (score >= 30) tier = 'bad';
  else tier = 'terrible';
  
  const pool = COMPLIANCE_FEEDBACK[tier];
  return {
    tier,
    message: pool[Math.floor(Math.random() * pool.length)]
  };
}

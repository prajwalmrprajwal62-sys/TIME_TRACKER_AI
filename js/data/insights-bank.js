// ============================================
// STD TIME TRACKER — Insights Bank
// ============================================

export const INSIGHTS = {
  dopamine: {
    mild: [
      "You spent {hours} on digital dopamine today. That's {percent}% of your waking hours handed to algorithms.",
      "Your phone consumed {hours} today. Every reel you watched was a choice to stay average.",
      "{hours} of scrolling. You know what's funny? The content you consumed won't matter in 24 hours.",
    ],
    moderate: [
      "📱 {hours} on Dopamine activities. You're literally training your brain to avoid hard work.",
      "Fun fact: You spent {hours} on your phone — that's {weeklyHours} this week. Some people built entire projects in that time.",
      "Your dopamine habit cost you {hours} today. At this rate, that's {monthlyHours} per month. Think about what you could've achieved.",
    ],
    brutal: [
      "🚨 {hours} of pure screen addiction. You're not relaxing — you're self-medicating. Face the tasks you're avoiding.",
      "You burn {hours} daily on dopamine. That's {yearlyHours} per year. Entire degrees are completed in fewer hours. Let that sink in.",
      "Your Instagram doesn't know your name. YouTube doesn't care about your grades. They got {hours} from you today. You got nothing back.",
    ]
  },
  
  fakeRest: {
    mild: [
      "You logged {hours} of 'Fake Rest'. Lying in bed with your phone isn't rest. Your brain knows the difference.",
      "{hours} in the Fake Rest zone. You weren't recharging — you were hiding.",
    ],
    moderate: [
      "⚠️ {hours} of Fake Rest detected. This is the sneakiest time thief. You feel like you rested, but you didn't.",
      "Fake Rest ({hours}): Neither productive nor restful. The worst of both worlds. Get up or actually sleep.",
    ],
    brutal: [
      "🛑 {hours} of Fake Rest. You're lying to yourself — literally. This is avoidance disguised as self-care.",
      "{hours} staring at a ceiling or scrolling in bed. That's not rest, that's surrender. You're better than this.",
    ]
  },

  avoidance: {
    mild: [
      "{hours} spent in Avoidance mode. Planning how to study isn't studying.",
      "Detected {hours} of avoidance behavior. Watching 'how to be productive' videos doesn't count as productivity.",
    ],
    moderate: [
      "🧠 {hours} of Avoidance. You're overthinking instead of doing. The first step is always the hardest — just start.",
      "You spent {hours} preparing to work without actually working. Perfectionism is just fear wearing a suit.",
    ],
    brutal: [
      "💀 {hours} of pure avoidance. You reorganized your notes instead of studying them. Classic self-sabotage.",
      "Analysis paralysis ate {hours} today. Stop planning the perfect study session and just open the damn book.",
    ]
  },

  sleep: {
    tooLittle: [
      "You slept {hours} — that's below the minimum for cognitive function. Your brain is literally impaired right now.",
      "⚠️ {hours} of sleep. Research shows this level of sleep deprivation equals being legally drunk. Study quality: garbage.",
      "{hours} sleep? Your memory consolidation is shot. Anything you studied yesterday is being actively forgotten.",
    ],
    tooMuch: [
      "You slept {hours}. Oversleeping is often a sign of avoidance — are you running from something?",
      "{hours} of sleep. Past 9 hours, additional sleep reduces productivity. You're hiding, not resting.",
    ],
    irregular: [
      "Your sleep time varies by {variance} hours across this week. Irregular sleep is worse than short sleep.",
      "Some nights you sleep at {earliest}, other nights at {latest}. Pick a time. Consistency beats duration.",
    ]
  },

  productivity: {
    low: [
      "Only {hours} of Deep Work today. That's {percent}% of your day. The other {wastedHours} went to... what exactly?",
      "📉 {hours} productive hours. At this rate, your semester goals need {daysNeeded} more days than you have.",
      "Your deep work to waste ratio is {ratio}:1. For every productive minute, you wasted {wasteMinutes} minutes.",
    ],
    improving: [
      "📈 {hours} of Deep Work — that's {change}% more than your average! Keep this momentum.",
      "Solid progress: {hours} productive hours. You're {percent}% above your weekly average. Don't let up.",
    ],
    excellent: [
      "🔥 {hours} of Deep Work! You're in the top tier today. This is what peak performance looks like.",
      "Incredible: {hours} of focused work. You outperformed your average by {change}%. The compound effect of days like this is massive.",
    ]
  },

  patterns: {
    morningWaste: [
      "🌅 Your mornings (6-12) are your weakest slot — only {hours} productive. You're giving away your best cognitive hours.",
      "Morning productivity: {percent}%. Your brain is sharpest before noon but you're using it for {topActivity}.",
    ],
    afternoonSlump: [
      "☀️ Afternoon productivity drops to {percent}%. This is normal — but you can fight it with a short walk, not a phone.",
      "Your 1-4 PM window is a black hole. {hours} wasted consistently. Try a power nap at 1, then focus session at 1:30.",
    ],
    nightOwl: [
      "🌙 You're most active after {peakTime} but your quality drops. Late-night study has 40% less retention.",
      "Night owl alert: {percent}% of your work happens after 10 PM. Shifting 2 hours earlier would improve quality significantly.",
    ],
    weekendDrop: [
      "📅 Weekend productivity drops {percent}% vs weekdays. You're losing 2 of 7 potential growth days every week.",
      "Weekends are your blind spot. Last weekend: {hours} total productive hours. That's less than a single weekday.",
    ]
  },

  userTypes: {
    'Dopamine Addict': {
      description: "You're chemically hooked on instant gratification. Your brain craves the next notification, reel, or like. Hard work feels unbearable because your dopamine baseline is artificially high.",
      fixSuggestions: [
        "Start with a 1-hour phone-free block each morning",
        "Delete social media apps for 7 days (keep the accounts, just remove access)",
        "Replace scrolling with a 5-minute walk when you feel the urge",
        "Use grayscale mode on your phone to reduce appeal",
      ]
    },
    'Night Waster': {
      description: "You come alive at night but it's a trap. You waste evenings on entertainment, then tell yourself you'll start fresh tomorrow. Tomorrow never comes.",
      fixSuggestions: [
        "Set a hard phone cutoff at 11 PM",
        "Prepare your next day's plan before 10 PM",
        "Move your hardest task to before noon",
        "Track your sleep consistently — you need 7+ hours",
      ]
    },
    'Overthinker': {
      description: "You spend more time thinking about work than doing it. You over-plan, over-organize, and over-prepare. The real fear isn't failure — it's starting.",
      fixSuggestions: [
        "Use a 2-minute rule: if thinking about it takes longer, just start doing it",
        "Limit planning to 10 minutes max, then execute",
        "Accept 'good enough' — perfectionism is the enemy of done",
        "Set a 25-minute timer and just work on ONE thing",
      ]
    },
    'Busy but Unproductive': {
      description: "You're always 'busy' but your results don't show it. You mistake motion for progress. Attending 5 lectures means nothing if you don't retain anything.",
      fixSuggestions: [
        "After each activity, ask: 'Did this move me closer to my goal?'",
        "Cut 2 low-value commitments this week",
        "Focus on output metrics (problems solved, pages written) not input (hours sat)",
        "Block schedule your top 3 priorities before filling in the rest",
      ]
    },
    'Inconsistent Performer': {
      description: "You have great days and terrible days. Your problem isn't ability — it's consistency. You rely on motivation instead of systems.",
      fixSuggestions: [
        "Set a daily MINIMUM (30 min deep work) even on bad days",
        "Don't aim for perfect days — aim for non-zero days",
        "Create a morning routine that auto-starts your work",
        "Track your streaks — your brain hates breaking patterns",
      ]
    },
    'Sleep-Deprived Warrior': {
      description: "You think sleeping less means working more. It doesn't. You're running on cognitive debt. Every hour of lost sleep costs you 2+ hours of next-day productivity.",
      fixSuggestions: [
        "Non-negotiable: 7 hours minimum sleep tonight",
        "No screens 30 minutes before bed",
        "Set a consistent sleep time and protect it like an exam",
        "Power naps (20 min) after lunch can save your afternoon",
      ]
    },
  },

  general: {
    tips: [
      "💡 Your best productive slot is {bestSlot}. Protect it fiercely — no meetings, no phone, no interruptions.",
      "💡 You're most likely to waste time on {topWaste} around {wasteTime}. Set a reminder to redirect.",
      "💡 You log {avgActivities} activities per day. More granular logging = better pattern detection.",
      "💡 Your mood is {mood}/5 on average. Low mood days correlate with {lowMoodCorrelation}.",
      "💡 Consider the Pomodoro technique: 25 min work, 5 min break. It works because it's just short enough to start.",
    ]
  },

  motivational: {
    streaks: [
      "🔥 {days}-day streak! You're building something most people never will: discipline.",
      "🔥 {days} consecutive days of commitment. This is how champions are forged.",
      "🔥 {days}-day streak. Your future self is already thanking you.",
    ],
    comebacks: [
      "Yesterday was rough. Today is a clean slate. One good hour changes everything.",
      "Bad days happen. What separates winners from everyone else? They show up anyway.",
      "You fell off yesterday. That's data, not a death sentence. Adjust and attack.",
    ]
  }
};

export function getRandomInsight(category, severity) {
  const pool = INSIGHTS[category]?.[severity];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function interpolateInsight(template, data) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

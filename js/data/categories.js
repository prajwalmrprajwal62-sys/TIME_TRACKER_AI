// ============================================
// STD TIME TRACKER — Activity Categories
// ============================================

export const CATEGORIES = [
  {
    name: 'Deep Work',
    icon: '🎯',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    keywords: ['study', 'coding', 'code', 'programming', 'research', 'writing', 'reading textbook', 'solving', 'problems', 'dsa', 'leetcode', 'math', 'physics', 'chemistry', 'biology', 'engineering', 'project work', 'thesis', 'revision', 'notes', 'practice', 'learning', 'upskilling', 'course', 'tutorial', 'deep focus', 'competitive programming', 'building', 'designing', 'creative work', 'brainstorming'],
    productivityWeight: 1.0,
    description: 'Focused intellectual work that creates real progress toward your goals.'
  },
  {
    name: 'College',
    icon: '🎓',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    keywords: ['class', 'lecture', 'lab', 'seminar', 'workshop', 'exam', 'test', 'quiz', 'presentation', 'assignment', 'homework', 'group study', 'library', 'campus', 'professor', 'attendance', 'practical', 'viva', 'submission', 'college fest'],
    productivityWeight: 0.7,
    description: 'Time spent in formal education activities.'
  },
  {
    name: 'Dopamine',
    icon: '📱',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
    keywords: ['instagram', 'youtube', 'reels', 'shorts', 'tiktok', 'gaming', 'games', 'reddit', 'twitter', 'x', 'scrolling', 'social media', 'snapchat', 'whatsapp status', 'memes', 'binge watching', 'netflix', 'amazon prime', 'hotstar', 'anime binge', 'online shopping', 'browsing', 'random videos', 'phone', 'pubg', 'bgmi', 'valorant', 'discord chat', 'telegram groups', 'doom scrolling'],
    productivityWeight: -1.0,
    description: 'Instant gratification activities that steal your time and focus.'
  },
  {
    name: 'Fake Rest',
    icon: '😶',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
    keywords: ['lying in bed', 'bed with phone', 'aimless', 'staring', 'daydreaming', 'thinking about studying', 'planning to study', 'in bed awake', 'wasting time', 'doing nothing', 'lazy', 'couch', 'procrastinating on bed', 'fake nap', 'pretending to rest'],
    productivityWeight: -0.8,
    description: 'You think you\'re resting, but you\'re just avoiding. Neither productive nor restful.'
  },
  {
    name: 'Good Rest',
    icon: '😴',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    keywords: ['sleep', 'nap', 'power nap', 'meditation', 'walk', 'exercise', 'gym', 'yoga', 'jogging', 'running', 'cycling', 'stretching', 'breathing', 'mindfulness', 'nature', 'park', 'actual rest', 'relaxation', 'hobby', 'music playing', 'instrument', 'painting', 'journaling', 'sports', 'cricket', 'football', 'badminton', 'swimming'],
    productivityWeight: 0.5,
    description: 'Genuine recovery that refuels your body and mind.'
  },
  {
    name: 'Social',
    icon: '👥',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    keywords: ['friends', 'hangout', 'party', 'call', 'phone call', 'video call', 'catching up', 'gossip', 'chatting', 'coffee with friends', 'outing', 'birthday', 'family', 'relatives', 'roommates', 'canteen', 'hostel talk', 'relationship', 'date'],
    productivityWeight: 0.0,
    description: 'Social interactions. Not bad in moderation, but watch out for time drains.'
  },
  {
    name: 'Maintenance',
    icon: '🔧',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
    keywords: ['food', 'eating', 'breakfast', 'lunch', 'dinner', 'cooking', 'shower', 'bath', 'getting ready', 'commute', 'travel', 'transport', 'bus', 'metro', 'auto', 'laundry', 'cleaning', 'chores', 'grocery', 'errands', 'appointment', 'doctor', 'pharmacy', 'bills', 'admin'],
    productivityWeight: 0.0,
    description: 'Necessary life maintenance. Optimize but don\'t eliminate.'
  },
  {
    name: 'Avoidance',
    icon: '🫣',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    keywords: ['procrastinating', 'overthinking', 'worrying', 'anxious', 'planning to plan', 'organizing instead of doing', 'researching how to study', 'watching study tips', 'motivation videos', 'reorganizing', 'perfecting notes', 'analysis paralysis', 'indecisive', 'avoiding', 'scared to start', 'what if'],
    productivityWeight: -0.6,
    description: 'You\'re busy but not progressing. The sneakiest form of self-sabotage.'
  }
];

export function classifyActivity(activityName) {
  const lower = activityName.toLowerCase().trim();
  
  let bestMatch = null;
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = cat.name;
        }
      }
    }
  }

  return bestMatch || 'Maintenance'; // Default to Maintenance if no match
}

export function getCategoryByName(name) {
  return CATEGORIES.find(c => c.name === name);
}

export function getProductiveCategories() {
  return CATEGORIES.filter(c => c.productivityWeight > 0).map(c => c.name);
}

export function getWastedCategories() {
  return CATEGORIES.filter(c => c.productivityWeight < 0).map(c => c.name);
}

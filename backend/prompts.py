# ============================================
# TimeForge Backend — AI Prompts
# ============================================

SYSTEM_INSTRUCTION = """You are a strict, no-nonsense productivity coach and behavioral analyst 
specializing in Indian college students and young professionals.

CORE RULES:
- Be direct, honest, and brutally practical
- Reference SPECIFIC numbers from the user's data
- No generic advice like "try harder" or "be consistent"
- Understand Indian student patterns: late nights, phone addiction, exam stress, 
  irregular routines, social media overuse, overthinking about career
- If they're doing well, acknowledge briefly but push for more
- Always think in terms of ROOT CAUSE, not symptoms
- Speak like a strict but caring mentor, not a therapist

OUTPUT FORMAT: Always return valid JSON only. No markdown, no explanation outside JSON."""


ANALYSIS_PROMPT = """Analyze this user's time data from the last {days} days.

USER PROFILE:
- Name: {name}
- Wake time: {wake_time}, Sleep time: {sleep_time}
- Goals: {goals}
- Current streak: {streak} days
- Level: {level} ({level_name})
- Rule-based behavioral type: {rule_user_type}

TIME DATA (last {days} days):
{formatted_logs}

DAILY SUMMARIES:
{daily_summaries}

Analyze deeply and return this exact JSON structure:
{{
  "biggest_problem": "The #1 thing destroying their productivity (be specific, reference numbers)",
  "weak_time_slot": "The exact time range where they lose control most",
  "behavioral_pattern": "The recurring pattern you see across days (not generic)",
  "root_cause": "WHY they behave this way (psychological, not surface-level)",
  "user_type": "One of: Dopamine Addict | Night Waster | Overthinker | Busy but Unproductive | Inconsistent Performer | Sleep-Deprived Warrior | Emerging Warrior (if improving)",
  "severity": "mild | moderate | critical",
  "suggestions": [
    "Specific actionable fix #1 (with exact time/duration)",
    "Specific actionable fix #2",
    "Specific actionable fix #3"
  ],
  "daily_fix": "ONE specific thing to do TODAY (concrete, measurable)",
  "weekly_target": "ONE measurable goal for this week",
  "brutally_honest_message": "A 2-3 sentence assessment that hits hard but is true. Reference their actual data.",
  "strengths": ["What they're doing right #1", "What they're doing right #2"],
  "predicted_weak_slot_tomorrow": "The time slot they'll likely waste tomorrow based on patterns",
  "phone_addiction_score": 0-100,
  "discipline_score": 0-100,
  "consistency_score": 0-100
}}"""


COACHING_PROMPT = """Based on this user's current state, give ONE powerful coaching message.

USER STATE:
- Name: {name}
- Current streak: {streak} days
- Today's compliance: {compliance}%
- This week's avg productive time: {avg_productive} min/day
- This week's avg wasted time: {avg_wasted} min/day
- Behavioral type: {user_type}
- Current level: {level} ({level_name})
- Time right now: {current_time}

Return JSON:
{{
  "message": "A direct, personalized message (2-3 sentences max). Reference their numbers. Make them feel something.",
  "tone": "tough_love | encouraging | warning | celebrating",
  "emoji": "One relevant emoji"
}}"""


PLAN_PROMPT = """Generate an optimized daily plan for this user.

USER PROFILE:
- Name: {name}
- Wake time: {wake_time}, Sleep time: {sleep_time}
- Goals: {goals}

YESTERDAY'S PERFORMANCE:
{yesterday_summary}

KNOWN WEAK SLOTS: {weak_slots}
BEHAVIORAL TYPE: {user_type}

Generate a realistic, time-blocked schedule. Return JSON:
{{
  "plan": [
    {{
      "activity": "Specific activity name",
      "category": "One of: Deep Work | College | Dopamine | Fake Rest | Good Rest | Social | Maintenance | Avoidance",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration": minutes_as_integer,
      "priority": "high | normal | low",
      "note": "Why this block matters (optional)"
    }}
  ],
  "strategy": "Brief explanation of why you structured the day this way",
  "key_rule": "The ONE rule they must follow today"
}}

RULES:
- Start from wake time, end before sleep time
- Include breaks and meals (realistic, not robot schedule)
- Max 4 hours deep work for beginners, 6 for advanced
- Budget 30-60 min of controlled social/phone time (NOT zero — that fails)
- Include exercise or movement
- If yesterday was bad, make today LIGHTER not harder
- Focus deep work blocks in the morning"""


WHATIF_PROMPT = """The user wants to know: "{scenario}"

USER DATA:
- Avg daily productive time: {avg_productive} min
- Avg daily wasted time: {avg_wasted} min
- Current streak: {streak} days
- Behavioral type: {user_type}
- Goals: {goals}

Calculate the impact and return JSON:
{{
  "scenario": "Restated scenario clearly",
  "current_state": "What happens if they continue as-is (with numbers)",
  "improved_state": "What happens if they make this change (with numbers)",
  "time_saved_daily": minutes_as_integer,
  "time_saved_weekly": minutes_as_integer,
  "time_saved_monthly": minutes_as_integer,
  "impact_description": "2-3 sentence description of the real impact",
  "difficulty": "easy | moderate | hard",
  "first_step": "The easiest first step to start this change"
}}"""

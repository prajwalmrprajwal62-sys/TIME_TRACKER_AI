# TimeForge v3.0 — Unified Production-Ready Master Spec
## For 4-Agent AI Build System (Collector, Analyzer, Planner, Enforcer)

---

# SECTION 0: CURRENT STATE AUDIT (Ground Truth from Testing)

Before building anything new, the AI agents MUST understand what currently EXISTS and WORKS vs what is BROKEN or MISSING. This audit is from real hands-on testing, not guesswork.

## ✅ WHAT EXISTS AND WORKS RIGHT NOW

### Frontend (Vanilla JS SPA — 12 pages, 4 agents, 5 core modules)
```
js/
├── app.js              → Main entry, auth flow, login/onboarding/app modes, auto-sync
├── agents/
│   ├── collector.js    → ✅ WORKING: Activity logging, daily summaries, localStorage CRUD
│   ├── analyzer.js     → ✅ WORKING: Rule-based day/week analysis, user type classification, pattern detection
│   ├── planner.js      → ✅ WORKING: Plan generation, time blocks, plan vs actual comparison
│   └── enforcer.js     → ✅ WORKING: Compliance scoring, XP, streaks, achievements, feedback
├── core/
│   ├── state.js        → ✅ WORKING: Centralized state manager + localStorage persistence 
│   ├── events.js       → ✅ WORKING: Event bus for inter-agent communication
│   ├── router.js       → ✅ WORKING: Hash-based SPA router
│   ├── utils.js        → ✅ WORKING: Date/time helpers, formatting utilities
│   └── api.js          → ✅ WORKING: Backend API service, JWT management, offline detection
├── pages/
│   ├── dashboard.js    → ✅ WORKING: Stats, charts, compliance, streak counter
│   ├── log-entry.js    → ✅ WORKING: Activity logging form with templates
│   ├── analytics.js    → ✅ WORKING: Charts, date filtering, category breakdown
│   ├── profile.js      → ✅ WORKING: Behavioral archetype, stats, strengths/weaknesses
│   ├── planner-page.js → ✅ WORKING: Today's plan, timeline view, plan vs actual
│   ├── goals.js        → ✅ WORKING: Goal CRUD, progress tracking (localStorage only)
│   ├── enforcer-page.js→ ✅ WORKING: Compliance score, deviations, feedback messages
│   ├── rewards.js      → ✅ WORKING: XP bar, levels, achievements grid, streak calendar
│   ├── insights.js     → ✅ WORKING: AI Deep Analysis + rule-based insights + AI What-If
│   ├── settings.js     → ✅ WORKING: Profile, preferences, backend status, sync, logout
│   ├── login.js        → ✅ WORKING: Login/Register with backend status detection
│   └── onboarding.js   → ✅ WORKING: 4-step onboarding flow
```

### Backend (FastAPI + SQLAlchemy + SQLite)
```
backend/
├── main.py             → ✅ WORKING: FastAPI app, CORS, health check, lifespan
├── config.py           → ✅ WORKING: Pydantic Settings (.env loading)
├── database.py         → ✅ WORKING: SQLAlchemy + SQLite WAL mode
├── models.py           → ✅ WORKING: 7 models (User, TimeLog, Goal, DailyPlan, StreakHistory, UserRewards, AIInsight)
├── schemas.py          → ✅ WORKING: Pydantic request/response schemas
├── auth.py             → ✅ WORKING: JWT + bcrypt (direct, not passlib) 
├── ai_engine.py        → ✅ WORKING: Gemini 2.5-flash-lite with caching + fallback to 2.5-flash
├── prompts.py          → ✅ WORKING: Strict mentor-toned prompts for Indian student context
├── routes/
│   ├── auth_routes.py  → ✅ WORKING: Register, Login, Profile
│   ├── log_routes.py   → ✅ WORKING: CRUD, range queries, daily summary, bulk sync
│   ├── goal_routes.py  → ✅ WORKING: CRUD
│   ├── plan_reward_routes.py → ✅ WORKING: Plans, Rewards, Streaks, Process-day
│   └── ai_routes.py    → ✅ WORKING: Analysis, Coaching, Generate-plan, What-if, History
```

## ⚠️ WHAT EXISTS BUT HAS ISSUES (Must Fix)

| Issue | Details | Priority |
|-------|---------|----------|
| **Goals page → backend not wired** | goals.js only saves to localStorage, never calls backend API | 🔴 HIGH |
| **Planner page → backend not wired** | planner-page.js only uses localStorage for plans | 🔴 HIGH |
| **Rewards → backend not wired** | XP/streak calculations are frontend-only, no persistence to DB | 🔴 HIGH |
| **Auto-sync is fire-and-forget** | LOG_CREATED event syncs to backend but doesn't handle failures or queue retries | 🟡 MEDIUM |
| **No token refresh** | JWT expires in 72h, user must re-login manually | 🟡 MEDIUM |
| **Data Export only exports localStorage** | Export button doesn't include backend data | 🟡 MEDIUM |
| **No error monitoring** | Backend errors are only printed to console, no Sentry | 🟡 MEDIUM |
| **Energy field exists in model but not in log form** | TimeLog has `energy` column but log-entry.js doesn't capture it properly | 🟡 MEDIUM |

## ❌ WHAT DOES NOT EXIST YET (New Features to Build)

These are the features from the Claude/Perplexity/ChatGPT outputs that do NOT exist in the codebase at all:

1. Weekly Review System — No page, no model, no route
2. Friction Tracking — No friction_reason field, no UI prompt
3. Energy-Aware Scheduling — Energy data not used in plan generation
4. Predictive Drift Detection — No background monitoring, no alerts
5. Accountability Partner — No model, no routes, no UI
6. Comparative Benchmarks — No aggregation, no comparison UI
7. Habit Stacking — No anchor detection, no suggestion engine
8. Onboarding v2 (pain-point diagnosis) — Current onboarding is generic
9. Quick Log Widget — No floating action button
10. Offline Sync Queue — No queuing mechanism for failed writes
11. Rate Limiting on AI routes — No slowapi or limiter
12. Recovery Protocol — No lighter "reset day" plan after streak breaks
13. Burnout Detection — No persistent low-energy/high-avoidance alerts

---

# SECTION 1: PRODUCT VISION

TimeForge is NOT a todo app. It is a **behavior-change system** that uses data, psychology, and AI to transform how inconsistent students and young professionals spend their time.

## Target Users
- **College students** (primary): dealing with late-night study, phone addiction, irregular routines, exam pressure
- **Competitive exam aspirants**: JEE, NEET, GATE, CAT — need extreme discipline tracking
- **Young professionals**: first-job struggles with time management, meeting fatigue, social media during work hours

## Core Philosophy
- **No motivational fluff** — data-driven, brutally honest feedback
- **No generic advice** — every insight references the user's actual logged data
- **Strict mentor tone** — firm but constructive, like a coach who cares but doesn't sugarcoat
- **Adapted for Indian student lifestyle** — accounts for late nights, exam cycles, phone addiction patterns, hostel routines
- **Offline-first** — works 100% without internet, syncs when backend is available
- **Small changes compound** — focus on 1% daily improvements, not dramatic overhauls

## Success Metrics
- Deep work hours per day (target: 4h+ for students, 6h+ for professionals)
- Streak length (consistency indicator)
- Wasted time reduction (week-over-week)
- Compliance score improvement (planned vs actual)
- User-reported "sense of control" (weekly review rating)

---

# SECTION 2: ARCHITECTURE

## 4-Agent Model

```
┌─────────────────────────────────────────────────────────────┐
│                     EVENT BUS (events.js)                     │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│          │          │          │                              │
│ COLLECTOR│ ANALYZER │ PLANNER  │         ENFORCER             │
│          │          │          │                              │
│ • Log    │ • Rules  │ • Daily  │ • Compliance scoring         │
│   capture│ • AI call│   plans  │ • XP / Streaks / Badges      │
│ • Sync   │ • Energy │ • Weekly │ • Feedback messages          │
│ • Offline│   detect │   goals  │ • Drift alerts               │
│   queue  │ • Habits │ • Energy │ • Recovery protocol          │
│ • Frict- │ • Bench- │   aware  │ • Accountability nudges      │
│   ion log│   marks  │ • AI gen │ • Weekly review enforcement  │
└──────────┴──────────┴──────────┴──────────────────────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              api.js (Write-Through Cache Layer)               │
│  localStorage (always) ──► Backend API (when online + auth)   │
│  Offline Queue ──► Auto-retry on reconnect                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (localhost:8000)                  │
│  Auth (JWT) │ CRUD Routes │ AI Engine (Gemini) │ Background   │
│  SQLAlchemy │ SQLite/WAL  │ Caching + Fallback │ Jobs         │
└─────────────────────────────────────────────────────────────┘
```

## Hybrid Storage Model
- **localStorage** = always the primary write target (instant, works offline)
- **Backend API** = secondary write target (called via api.js when online + authenticated)
- **Offline Queue** = failed backend writes are queued in localStorage and retried when connectivity returns
- **Backend is the source of truth for AI** = AI analysis uses backend data (richer queries, cross-day aggregation)

---

# SECTION 3: DATA MODEL (Backend — Complete)

## Existing Models (Keep As-Is)

### User
- id (PK), email, hashed_password, name
- wake_time, sleep_time, goals_text (JSON), settings_json
- **NEW: role** (student/professional/other — for benchmarks)
- created_at

### TimeLog (Extend)
- id, user_id (FK), activity, category
- start_time, end_time, duration, mood, energy
- notes, date, created_at
- **NEW: friction_reason** (enum string, nullable — "bored", "stuck", "tired", "autopilot", "emotional", "other")
- **NEW: friction_text** (free text, nullable — user's own words when "other" is selected)

### Goal (Keep As-Is)
- id, user_id, title, type, deadline, daily_effort, progress, priority, created_at

### DailyPlan (Extend)
- id, user_id, date, plan_json, created_at
- **NEW: generated_by** (string — "manual", "rule", "ai")

### StreakHistory (Keep As-Is)
- id, user_id, date, compliance_score

### UserRewards (Keep As-Is)
- id, user_id, xp, level, level_name, achievements_json, current_streak, best_streak

### AIInsight (Keep As-Is)
- id, user_id, date, analysis_json, user_type, created_at

## NEW Models

### WeeklyReview
```python
class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date = Column(String(10), nullable=False, index=True)  # Monday YYYY-MM-DD
    summary_json = Column(Text, nullable=False)  # Cached metrics: deep_work, wasted, compliance, etc.
    reflection_text = Column(Text, default="")      # User's written reflection
    focus_area = Column(String(255), default="")     # ONE focus for next week
    wins = Column(Text, default="[]")                # JSON array of user-identified wins
    rating = Column(Integer, default=3)              # 1-5: How do you feel about this week?
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="weekly_reviews")
```

### AccountabilityPartner
```python
class AccountabilityPartner(Base):
    __tablename__ = "accountability_partners"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    partner_email = Column(String(255), nullable=False)
    partner_name = Column(String(100), default="")
    status = Column(String(20), default="pending")   # pending/active/blocked
    permissions_json = Column(Text, default='{"daily_summary":true,"weekly_report":true,"streak_alert":true}')
    invite_code = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="accountability_partners")
```

### BenchmarkSnapshot
```python
class BenchmarkSnapshot(Base):
    __tablename__ = "benchmark_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    segment = Column(String(20), nullable=False, index=True)   # "student" or "professional"
    date = Column(String(10), nullable=False, index=True)
    metrics_json = Column(Text, nullable=False)
    # metrics_json contains: avg_deep_work, avg_wasted, avg_compliance, avg_streak, user_count
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### DriftAlert
```python
class DriftAlert(Base):
    __tablename__ = "drift_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # "low_deep_work", "streak_risk", "dopamine_spiral", "burnout"
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="warning")  # "info", "warning", "critical"
    acknowledged = Column(Integer, default=0)          # 0 = pending, 1 = seen, 2 = snoozed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")
```

---

# SECTION 4: NEW FEATURES SPEC (Prioritized)

## PRIORITY 1: MUST-HAVE FOR PRODUCTION (Build First)

### Feature 1: Weekly Review System
**Why:** Without forced reflection, users drift back to old patterns after 10-14 days. The "fresh start effect" is scientifically proven.

**Frontend (New Page: weekly-review.js):**
- Triggered when user navigates to dashboard on review day (default: Sunday) and review is pending
- Shows a subtle but persistent banner on ALL pages: "📋 Weekly Review pending — Complete it to unlock rewards"
- Full-screen Weekly Review page with sections:
  1. **Week at a Glance** — total deep work, total wasted, compliance trend (mini chart), streak status
  2. **Biggest Win** — auto-detected OR user selects from a list of highlights
  3. **Biggest Problem** — AI-generated or rule-based "Your weakest pattern this week was..."
  4. **Reflection Prompt** — text area: "What went wrong this week? Be honest with yourself." (min 20 characters)
  5. **Next Week's ONE Focus** — dropdown or free text: pick ONE thing to improve
  6. **Rate Your Week** — 1-5 stars: "How in control did you feel?"
  7. **Submit** → 100 XP reward, special badge unlocked if completed 4 weeks in a row
- After submission: redirect to Dashboard with congratulatory toast

**Backend:**
- Model: `WeeklyReview` (defined above)
- Routes:
  - `GET /api/reviews/weekly/current` — returns current week's review (or empty if not started)
  - `POST /api/reviews/weekly` — creates/updates review
  - `GET /api/reviews/weekly/history` — all past reviews for trend tracking
- AI Enhancement: When generating review summary, call Gemini with last 7 days of logs to auto-generate `summary_json` with fields: `total_deep_work`, `total_wasted`, `compliance_avg`, `best_day`, `worst_day`, `biggest_time_sink`, `ai_verdict`

**Enforcer Integration:**
- If weekly review is pending and it's past Monday noon, Enforcer blocks XP gain until review is completed
- Recovery: submitting the review retroactively unlocks any blocked XP

---

### Feature 2: Friction Tracking
**Why:** The gap between "planned 2h coding" and "did 0h coding" is often friction — not laziness. Tracking WHY users go to distractions reveals root causes that generic insights miss.

**Frontend (Modify: log-entry.js):**
- When user logs an activity with a "wasted" category (Dopamine, Fake Rest, Avoidance), show a post-log overlay:
  ```
  "Why did you go here? (This helps us understand your patterns)"
  
  🎯 Bored — nothing engaging to do
  🧱 Stuck — couldn't figure out my task  
  😴 Tired — low energy, needed escape
  🤖 Autopilot — opened app without thinking
  😰 Emotional — stressed, anxious, or upset
  📦 Other: [text input]
  
  [Skip] [Save]
  ```
- Friction data is stored with the log entry
- Insights page shows friction pattern analysis after 7+ days of data:
  - "You go to Instagram when STUCK 70% of the time"
  - "Suggestion: Next time you feel stuck, try a 5-min walk or ask for help before opening your phone"

**Backend:**
- Add `friction_reason` and `friction_text` columns to TimeLog model
- Update `schemas.py` LogCreate/LogResponse to include these fields
- Update AI prompts to include friction data in behavioral analysis

**Analyzer Integration:**
- New function: `detectFrictionPatterns(logs_14_days)` → returns { trigger: string, frequency: number, suggestion: string }[]
- Feed friction patterns into AI analysis prompt for deeper root-cause insights

---

### Feature 3: Energy-Aware Scheduling
**Why:** A night owl forced to do deep work at 6 AM will fail. Planning must respect WHEN users have peak energy.

**Frontend (Modify: log-entry.js + planner-page.js):**
- Log form: Add prominent energy level picker (existing energy field, but make it visible):
  ```
  Energy Level: [ ⚡ Low ] [ ⚡⚡ Medium ] [ ⚡⚡⚡ High ]
  ```
- Profile page: Show "Your Energy Map" after 7 days of data
  ```
  Morning (6-12): ⚡⚡⚡ HIGH — Schedule deep work here
  Afternoon (12-5): ⚡ LOW — Do shallow tasks
  Evening (5-9): ⚡⚡ MEDIUM — Good for moderate work
  Night (9-12): ⚡⚡⚡ HIGH — Your second peak!
  ```
- Planner: When generating daily plan, auto-assign categories based on energy:
  - Deep Work → HIGH energy slots
  - Shallow tasks (emails, admin) → LOW energy slots
  - Social/Meetings → MEDIUM energy slots
  - Enforcer warns: "⚠️ You scheduled Deep Work at 2 PM but you always crash then"

**Backend:**
- Ensure `energy` field is properly captured in log create/sync routes
- New Analyzer function: `detect_energy_patterns(logs_14_days)` → returns { time_slot: string, avg_energy: number, suggested_activity_type: string }[]
- Modify AI plan generation prompt to include energy data

---

### Feature 4: Full Frontend ↔ Backend Wiring
**Why:** Currently Goals, Planner, and Rewards pages only use localStorage. This means data is lost on browser clear and can't be synced across devices.

**Goals Page (goals.js):**
- On goal create/update/delete: call backend API via api.js AND update localStorage
- On page mount: load from localStorage (instant), then fetch from backend and merge
- Add sync status indicator: "☁️ Synced" or "📱 Local only"

**Planner Page (planner-page.js):**
- Save generated plans to backend via `POST /api/plans`
- Load plans from backend on mount (with localStorage fallback)
- When AI plan generation is available, add "🤖 Generate AI Plan" button

**Rewards Page (rewards.js):**
- After daily compliance calculation, push to backend via `POST /api/rewards/process-day`
- Sync streak and XP to backend so it persists across devices
- Load from backend on mount

**Offline Queue (NEW: js/core/sync-queue.js):**
```
- When any backend write fails (network error), push to localStorage queue:
  { id, endpoint, method, body, timestamp, retries }
- On app boot + every 5 minutes: check queue, retry failed writes
- Max 3 retries per item before marking as "failed"
- Show queue status in Settings: "3 items pending sync"
```

---

### Feature 5: Predictive Drift Detection & Alerts
**Why:** Reacting at end of day is too late. Proactive intervention prevents streak breaks.

**Backend (New: background drift checker):**
- Run every 6 hours (or on demand via API call):
  1. Compare today's progress vs user's 7-day baseline
  2. Check if compliance has declined 3+ consecutive days
  3. Check if wasted time is spiking (15m → 45m → 2h pattern)
  4. Check for burnout signals (persistent low energy + rising avoidance)
- Generate `DriftAlert` records with appropriate severity and message
- Max 1 alert per user per day

**API Routes:**
- `GET /api/alerts/pending` — returns unacknowledged alerts for the user
- `POST /api/alerts/{id}/acknowledge` — marks alert as seen or snoozed (24h snooze)

**Frontend:**
- On app boot + every 30 minutes: check for pending alerts
- Show as non-intrusive toast-style notification at bottom of screen:
  ```
  ⚠️ "It's 8 PM and you've done only 30min of deep work (usual: 2h). Want a rescue plan?"
  [Show Rescue Plan] [Snooze 24h] [Dismiss]
  ```
- "Show Rescue Plan" → navigates to Planner with a pre-generated mini recovery plan

---

## PRIORITY 2: HIGH-VALUE DIFFERENTIATION (Build Second)

### Feature 6: Improved Onboarding (Pain-Point Diagnosis)
**Current problem:** Generic onboarding doesn't address the user's specific struggle.

**New Onboarding Flow (Modify: onboarding.js):**
```
Step 1: "Welcome to TimeForge. Why are you here?" (forces self-diagnosis)
  [ ] 😩 I procrastinate too much
  [ ] 📉 I'm inconsistent with goals  
  [ ] 📱 I waste time on distractions
  [ ] ❓ I don't know where my time goes
  [ ] 📚 Exam preparation mode

Step 2: Based on answer, show CUSTOM setup:
  - Procrastinator → "We'll break tasks into 15-min blocks. Set your wake time:"
  - Inconsistent → "We'll build your streak system. What's your ONE goal?"
  - Distracted → "We'll track your triggers. What's your #1 distraction app?"
  - Exam mode → "When is your exam? We'll build a countdown-based plan."

Step 3: Basic schedule (keep existing wake/sleep time inputs)

Step 4: "Log your FIRST activity right now." (immediate action = commitment)
  - Pre-filled with: "What did you do in the last hour?"
  - Forces first log before seeing dashboard
```

---

### Feature 7: Accountability Partner
**Why:** The #1 reason people fail at consistency: no one is watching. Sharing with ONE person increases follow-through by 65%.

**Backend:**
- Model: `AccountabilityPartner` (defined above)
- Routes:
  - `POST /api/accountability/invite` — generates invite code + optional email
  - `POST /api/accountability/accept/{invite_code}` — partner registers/links
  - `GET /api/accountability/partner-view/{user_id}` — read-only aggregate metrics
  - `POST /api/accountability/nudge` — partner sends encouragement
  - `GET /api/accountability/my-buddy` — check if user has a partner

**Frontend (New section in Settings or dedicated page):**
- "Invite Accountability Buddy" — generates shareable link
- Privacy: Buddy sees ONLY: streak, deep work hours, compliance %, level — NOT specific activities or notes
- Nudge appears as toast: "💪 Your buddy [name] says: Keep going!"
- If streak breaks, buddy is notified (if permission granted)

---

### Feature 8: Recovery Protocol
**Why:** After a bad day (0% compliance, streak broken), most users abandon the app. Recovery protocol prevents this.

**Enforcer Logic:**
```
IF compliance_yesterday < 20% OR streak_just_broke:
  → Planner generates a LIGHTER "recovery day" plan:
    - Only 3 small blocks (not 8)
    - First block is always easy: "5 min planning"
    - Focus metric: "Win the morning" (complete 1 productive block before noon)
  → Enforcer shows encouraging message instead of harsh feedback:
    "Yesterday was rough. That's okay. Today we reset with a simple plan."
  → XP penalty is REDUCED (50% of normal loss)
  → Special "Phoenix" badge if user recovers from 3+ bad days
```

---

### Feature 9: Habit Stacking & Loop Mapping
**Why:** New habits fail when isolated. Linking to existing routines = 3x higher success rate.

**Analyzer Enhancement:**
- Scan 21 days of logs for stable anchors (activities that happen every day at similar times)
- Examples: "Morning coffee at 8 AM", "After classes at 4 PM", "Post-dinner at 9 PM"
- Suggest micro-habits attached to anchors:
  - "You always have coffee at 8 AM. Want to add 10-min planning right after?"
  - "You browse Instagram every day at 10 PM. Replace the first 15 min with journaling?"

**Frontend (New section in Insights or Profile):**
- "Habit Loop Map" visualization showing: CUE → ROUTINE → REWARD
- Users can accept/reject suggestions, track adherence

---

### Feature 10: Comparative Intelligence (Anonymous Benchmarks)
**Why:** "Am I doing well?" is unanswerable without context. Anonymous peer data gives realistic targets.

**Backend:**
- Daily aggregation job: computes cohort averages by segment (student/professional)
- Model: `BenchmarkSnapshot` (defined above)
- Route: `GET /api/benchmarks/compare?segment=student`
- Privacy: Only aggregates for cohorts with 10+ users. No individual data shared.

**Frontend (New section on Dashboard or Profile):**
```
📊 How You Compare (Students)
Your deep work: 3.2h/day → Top 30% 🟢
Your wasted time: 1.8h/day → Better than 55% 🟡
Your compliance: 72% → Average 🟡
Your streak: 12 days → Top 15% 🟢
```

---

## PRIORITY 3: POLISH & DEPLOYMENT (Build Last)

### Feature 11: Mobile-First Improvements
- **Quick Log Widget**: Floating "+" button (bottom-right), 3-tap logging: activity → duration → done
- **Responsive fixes**: Test all pages on 375px width, ensure all grids collapse properly
- **Touch-friendly**: Larger tap targets on mobile, swipe gestures for navigation

### Feature 12: Rate Limiting & Cost Control
```python
# Install: pip install slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

# Apply to AI routes only:
@router.get("/analysis")
@limiter.limit("5/hour")
async def get_analysis(...): ...

@router.get("/coaching")  
@limiter.limit("10/hour")
async def get_coaching(...): ...

@router.post("/what-if")
@limiter.limit("10/hour")
async def what_if(...): ...
```

### Feature 13: Deployment Strategy
**Frontend:** Already on Netlify ✅
**Backend:** Deploy to Railway.app (recommended for free tier):
1. Create `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
2. Push to GitHub → Link Railway to repo
3. Set env vars in Railway dashboard (SECRET_KEY, GEMINI_API_KEY, DATABASE_URL)
4. Update api.js `API_BASE` to Railway URL (or make it configurable)
5. Update backend CORS to allow Netlify origin

**Migration Path:**
```
Phase 1 (Now): SQLite on Railway (fine for < 50 users)
Phase 2 (50+ users): PostgreSQL on Railway (swap DATABASE_URL, zero code changes)
Phase 3 (Scale): PostgreSQL on AWS RDS + Redis caching + Fly.io
```

---

# SECTION 5: API SURFACE (Complete)

## Existing Routes (Keep)
```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me
  PUT    /api/auth/profile

Logs:
  POST   /api/logs
  GET    /api/logs
  GET    /api/logs/range?start=&end=
  GET    /api/logs/summary/{date}
  PUT    /api/logs/{id}
  DELETE /api/logs/{id}
  POST   /api/logs/sync

Goals:
  POST   /api/goals
  GET    /api/goals
  PUT    /api/goals/{id}
  DELETE /api/goals/{id}

Plans & Rewards:
  POST   /api/plans
  GET    /api/plans/{date}
  GET    /api/plans/week
  GET    /api/rewards
  POST   /api/rewards/process-day

AI:
  GET    /api/ai/analysis
  GET    /api/ai/coaching
  POST   /api/ai/generate-plan
  POST   /api/ai/what-if
  GET    /api/ai/history
```

## NEW Routes
```
Weekly Reviews:
  GET    /api/reviews/weekly/current
  POST   /api/reviews/weekly
  GET    /api/reviews/weekly/history

Accountability:
  POST   /api/accountability/invite
  POST   /api/accountability/accept/{invite_code}
  GET    /api/accountability/partner-view/{user_id}
  POST   /api/accountability/nudge
  GET    /api/accountability/my-buddy

Alerts:
  GET    /api/alerts/pending
  POST   /api/alerts/{id}/acknowledge

Benchmarks:
  GET    /api/benchmarks/compare?segment=student|professional

Health (extended):
  GET    /api/health  → already exists, add: user_count, avg_streak, uptime
```

---

# SECTION 6: AGENT-SPECIFIC RESPONSIBILITIES

## Agent 1: COLLECTOR
**Core Job:** Capture, normalize, and sync all user activity data.

Must handle:
- Activity logging (existing) — all writes go to localStorage FIRST, then backend
- **NEW: Friction capture** — post-log overlay for wasted-time categories
- **NEW: Energy capture** — ensure energy picker is prominent in log form
- **NEW: Offline queue** — queue failed backend writes, retry on reconnect
- **NEW: Quick log** — floating "+" button for rapid 3-tap logging
- Bulk sync (existing) — push all localStorage data to backend on demand
- Real-time sync (existing) — fire-and-forget on LOG_CREATED events

## Agent 2: ANALYZER
**Core Job:** Extract patterns, insights, and predictions from user data.

Must handle:
- Daily/weekly analysis (existing) — rule-based summaries, user type classification
- AI analysis integration (existing) — call backend AI routes for Gemini-powered insights
- **NEW: Friction pattern detection** — "You scroll Instagram when stuck 70% of the time"
- **NEW: Energy pattern mapping** — detect peak/crash windows from energy data
- **NEW: Habit anchor detection** — find stable routines for habit stacking suggestions
- **NEW: Drift detection** — compare today's progress vs 7-day baseline, flag deviations
- **NEW: Benchmark comparison** — fetch anonymous cohort data for percentile ranking
- **NEW: Burnout detection** — persistent low energy + rising avoidance = burnout risk

## Agent 3: PLANNER
**Core Job:** Generate realistic, adaptive plans that respect user energy, goals, and patterns.

Must handle:
- Daily plan generation (existing) — time blocks based on goals and schedule
- **NEW: Energy-aware scheduling** — assign deep work to HIGH energy slots, shallow to LOW
- **NEW: AI plan generation** — call backend `/api/ai/generate-plan` with full context
- **NEW: Recovery day plans** — generate lighter plans after streak breaks
- **NEW: Exam mode** — countdown-based planning that intensifies as exam approaches
- **NEW: Weekly focus integration** — align daily plans with the single focus from Weekly Review
- Plan vs actual comparison (existing) — deviation tracking

## Agent 4: ENFORCER
**Core Job:** Drive accountability, feedback, rewards, and behavioral enforcement.

Must handle:
- Compliance calculation (existing) — plan vs actual scoring
- XP/Streak/Achievement management (existing)
- Feedback messages (existing) — strict mentor tone
- **NEW: Weekly review enforcement** — block XP gain until review is submitted (soft block, not hard)
- **NEW: Recovery protocol** — lighter plan + encouraging message after bad days
- **NEW: Drift alert surfacing** — display pending alerts from backend as non-intrusive notifications
- **NEW: Accountability nudge display** — show partner's nudge messages
- **NEW: Dynamic difficulty** — if user is struggling (3 consecutive bad days), Enforcer REDUCES expectations instead of increasing pressure

---

# SECTION 7: FRONTEND PAGE MAP (Complete)

| Page | Status | Key Enhancement |
|------|--------|----------------|
| Dashboard | ✅ Built | Add: benchmark comparison widget, pending alerts, weekly review banner |
| Log Activity | ✅ Built | Add: friction capture overlay, prominent energy picker, quick log button |
| Analytics | ✅ Built | Add: energy heatmap, friction category breakdown |
| Profile | ✅ Built | Add: energy map, habit loop visualization |
| Planner | ✅ Built | Add: AI plan generation button, energy-aware color coding, recovery mode |
| Goals | ✅ Built | Wire to backend, add exam mode countdown |
| Enforcer | ✅ Built | Add: recovery protocol messages, dynamic difficulty indicator |
| Rewards | ✅ Built | Wire to backend, add Weekly Review streak badge |
| Insights | ✅ Built | Add: friction pattern analysis, energy insights, habit stacking suggestions |
| Settings | ✅ Built | Add: accountability buddy section, offline queue status, review day picker |
| Login | ✅ Built | No changes needed |
| Onboarding | ✅ Built | Overhaul with pain-point diagnosis flow |
| **Weekly Review** | ❌ NEW | Full new page (described in Feature 1) |
| **Quick Log** | ❌ NEW | Floating action button (bottom-right corner, always visible) |

---

# SECTION 8: EXECUTION PHASES

## Phase 1: Fix & Wire (Week 1)
**Goal:** Make everything that exists actually work end-to-end.
1. Wire Goals page to backend API
2. Wire Planner page to backend API
3. Wire Rewards/XP sync to backend
4. Build offline sync queue (sync-queue.js)
5. Add friction_reason + friction_text to TimeLog model + log form
6. Make energy picker visible in log form
7. Fix data export to include backend data

## Phase 2: Core New Features (Week 2)  
**Goal:** Ship the 3 features that make the biggest behavioral impact.
1. Build Weekly Review page + backend routes + enforcer integration
2. Build Friction pattern analysis in Analyzer + Insights page section
3. Build Energy-aware scheduling in Planner + Profile energy map
4. Build Drift Detection backend + alert display on frontend

## Phase 3: Differentiation Features (Week 3)
**Goal:** Features that make TimeForge unique — not available in any other app.
1. Accountability Partner backend + Settings UI
2. Recovery Protocol in Enforcer + Planner
3. Habit Stacking detection in Analyzer + Insights visualization
4. Improved Onboarding with pain-point diagnosis
5. Anonymous Benchmarks (backend aggregation + Dashboard widget)

## Phase 4: Deploy & Polish (Week 4)
**Goal:** Production-ready deployment.
1. Deploy backend to Railway (Procfile, env vars, PostgreSQL)
2. Update frontend API_BASE to Railway URL
3. Test Netlify frontend + Railway backend E2E
4. Add rate limiting on AI routes (slowapi)
5. Mobile responsiveness audit + Quick Log button
6. Beta test with 5 friends, iterate on feedback

---

# SECTION 9: AI PROMPT ENHANCEMENTS

The existing AI prompts in `prompts.py` should be updated to include the new data fields. Here are the additions:

**For Behavioral Analysis (add to ANALYSIS_PROMPT):**
```
FRICTION DATA (last {days} days):
{friction_summary}
Example: "Bored: 12 times, Stuck: 8 times, Autopilot: 15 times"

ENERGY PATTERNS:
{energy_patterns}
Example: "Morning(6-12): avg 4.2/5, Afternoon(12-5): avg 2.1/5, Evening(5-9): avg 3.5/5, Night(9-12): avg 3.8/5"

Based on this friction and energy data, identify:
- The user's primary friction trigger and how to address it
- Whether the user is scheduling tasks against their natural energy flow
- Hidden burnout signals (persistent low energy + rising avoidance days)
```

**For Weekly Review AI Summary (NEW PROMPT):**
```
You are reviewing {name}'s week ({week_start} to {week_end}).

Data:
- Total deep work: {total_deep_work} minutes
- Total wasted: {total_wasted} minutes  
- Average compliance: {avg_compliance}%
- Streak: {streak_days} days
- Best day: {best_day} ({best_day_deep_work}min deep work)
- Worst day: {worst_day} ({worst_day_wasted}min wasted)
- Top friction trigger: {top_friction}
- Energy pattern: {energy_summary}

Generate a JSON response with:
{
  "week_grade": "A/B/C/D/F",
  "one_line_verdict": "Brutally honest 1-line summary of the week",
  "biggest_win": "What went right",
  "biggest_problem": "What went wrong with specific data",
  "root_cause": "Why the problem happened (psychological/behavioral)",
  "next_week_suggestion": "ONE specific, actionable thing to focus on",
  "motivation_message": "2-3 sentences, tough love but hopeful"
}
```

---

# SECTION 10: WHAT MAKES THIS A REAL PRODUCT (Not Another Todo App)

1. **Behavioral profiling** — not task tracking, but IDENTITY tracking (who are you becoming?)
2. **4-agent architecture** — separation of concerns means each agent does its job well
3. **Friction tracking** — addresses WHY people fail, not just WHAT they did wrong
4. **Energy-aware planning** — respects biology instead of fighting it
5. **Weekly reviews** — forces reflection, prevents silent drift
6. **Accountability** — selective vulnerability with ONE trusted person
7. **Recovery protocol** — prevents app abandonment after bad days
8. **Strict mentor AI** — not generic motivation, but data-backed tough love
9. **Indian student context** — understands late nights, exam pressure, phone addiction
10. **Offline-first** — works everywhere, syncs when possible

**Your unfair advantage:** You're building this AS an inconsistent student. Every feature should answer: "Would this have helped ME 6 months ago?"

---

> **This document is designed to be given directly to a 4-agent AI build system. Each agent should read SECTION 6 for its specific responsibilities, SECTION 4 for feature details, SECTION 3 for data models, and SECTION 8 for execution order. The system should execute Phase 1 first, verify all tests pass, then proceed to Phase 2.**

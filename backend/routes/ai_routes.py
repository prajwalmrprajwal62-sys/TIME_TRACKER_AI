# ============================================
# TimeForge Backend — AI Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from database import get_db
from models import User, TimeLog, UserRewards, AIInsight
from auth import get_current_user
from ai_engine import analyze_behavior, get_coaching_message, generate_ai_plan, analyze_what_if

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


def _get_user_context(user: User, db: Session, days: int = 7):
    """Gather user context for AI analysis."""
    # Get logs for last N days
    today = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    logs = (
        db.query(TimeLog)
        .filter(TimeLog.user_id == user.id, TimeLog.date >= start_date)
        .order_by(TimeLog.date.asc(), TimeLog.start_time.asc())
        .all()
    )

    # Format logs
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "date": log.date,
            "activity": log.activity,
            "category": log.category,
            "start_time": log.start_time,
            "end_time": log.end_time,
            "duration": log.duration,
            "mood": log.mood,
            "energy": log.energy,
        })

    # Calculate daily summaries
    daily_data = {}
    productive_cats = {"Deep Work", "College"}
    wasted_cats = {"Dopamine", "Fake Rest", "Avoidance"}

    for log in logs:
        if log.date not in daily_data:
            daily_data[log.date] = {"productive": 0, "wasted": 0, "count": 0}
        daily_data[log.date]["count"] += 1
        if log.category in productive_cats:
            daily_data[log.date]["productive"] += log.duration
        elif log.category in wasted_cats:
            daily_data[log.date]["wasted"] += log.duration

    daily_summaries = [
        {
            "date": date,
            "productive_minutes": d["productive"],
            "wasted_minutes": d["wasted"],
            "log_count": d["count"],
        }
        for date, d in sorted(daily_data.items())
    ]

    # Get rewards
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user.id).first()

    # Parse user goals
    try:
        goals = json.loads(user.goals_text) if user.goals_text else []
    except:
        goals = []

    return {
        "logs": formatted_logs,
        "daily_summaries": daily_summaries,
        "rewards": rewards,
        "goals": goals,
    }


@router.get("/analysis")
def get_ai_analysis(
    days: int = Query(default=7, ge=3, le=30),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI behavioral analysis."""
    ctx = _get_user_context(user, db, days)

    if len(ctx["logs"]) < 3:
        return {
            "analysis": None,
            "message": "Need at least 3 logged activities for AI analysis. Keep logging!",
            "source": "insufficient_data",
        }

    rewards = ctx["rewards"]
    result = analyze_behavior(
        user_name=user.name,
        wake_time=user.wake_time,
        sleep_time=user.sleep_time,
        goals=ctx["goals"],
        streak=rewards.current_streak if rewards else 0,
        level=rewards.level if rewards else 1,
        level_name=rewards.level_name if rewards else "Novice",
        rule_user_type=None,
        logs=ctx["logs"],
        daily_summaries=ctx["daily_summaries"],
        user_id=user.id,
    )

    if not result:
        return {
            "analysis": None,
            "message": "AI analysis unavailable. Check your Gemini API key in backend/.env",
            "source": "ai_unavailable",
        }

    source = result.pop("_source", "ai")

    # Cache in DB for historical reference
    if source == "ai":
        today = datetime.now().strftime("%Y-%m-%d")
        insight = AIInsight(
            user_id=user.id,
            date=today,
            analysis_json=json.dumps(result),
            user_type=result.get("user_type"),
        )
        db.add(insight)
        db.commit()

    return {
        "analysis": result,
        "source": source,
        "log_count": len(ctx["logs"]),
        "days_analyzed": len(ctx["daily_summaries"]),
    }


@router.get("/coaching")
def get_coaching(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a personalized coaching message."""
    ctx = _get_user_context(user, db, 7)
    rewards = ctx["rewards"]

    # Calculate averages
    summaries = ctx["daily_summaries"]
    avg_prod = sum(s["productive_minutes"] for s in summaries) // max(1, len(summaries))
    avg_waste = sum(s["wasted_minutes"] for s in summaries) // max(1, len(summaries))

    # Today's compliance (simplified)
    today = datetime.now().strftime("%Y-%m-%d")
    today_summary = next((s for s in summaries if s["date"] == today), None)
    compliance = 0
    if today_summary and today_summary["productive_minutes"] + today_summary["wasted_minutes"] > 0:
        total = today_summary["productive_minutes"] + today_summary["wasted_minutes"]
        compliance = round((today_summary["productive_minutes"] / total) * 100)

    result = get_coaching_message(
        user_name=user.name,
        streak=rewards.current_streak if rewards else 0,
        compliance=compliance,
        avg_productive=avg_prod,
        avg_wasted=avg_waste,
        user_type=None,
        level=rewards.level if rewards else 1,
        level_name=rewards.level_name if rewards else "Novice",
        user_id=user.id,
    )

    if not result:
        return {
            "message": "Keep pushing. Every logged minute is a step toward control.",
            "tone": "encouraging",
            "emoji": "💪",
            "source": "fallback",
        }

    result["source"] = "ai"
    return result


@router.post("/generate-plan")
def generate_plan(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate an AI-optimized daily plan."""
    ctx = _get_user_context(user, db, 3)

    # Get yesterday's summary
    from datetime import date as date_type
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_summary = next((s for s in ctx["daily_summaries"] if s["date"] == yesterday), None)

    result = generate_ai_plan(
        user_name=user.name,
        wake_time=user.wake_time,
        sleep_time=user.sleep_time,
        goals=ctx["goals"],
        yesterday_summary=yesterday_summary,
        weak_slots=[],
        user_type=None,
        user_id=user.id,
    )

    if not result:
        return {
            "plan": None,
            "message": "AI plan generation unavailable. Using rule-based planner instead.",
            "source": "ai_unavailable",
        }

    result["source"] = "ai"
    return result


@router.post("/what-if")
def what_if_analysis(
    scenario: str = Query(..., description="What-if scenario to analyze"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI-powered What-If scenario analysis."""
    ctx = _get_user_context(user, db, 7)
    rewards = ctx["rewards"]

    summaries = ctx["daily_summaries"]
    avg_prod = sum(s["productive_minutes"] for s in summaries) // max(1, len(summaries))
    avg_waste = sum(s["wasted_minutes"] for s in summaries) // max(1, len(summaries))

    result = analyze_what_if(
        scenario=scenario,
        avg_productive=avg_prod,
        avg_wasted=avg_waste,
        streak=rewards.current_streak if rewards else 0,
        user_type=None,
        goals=ctx["goals"],
    )

    if not result:
        return {"analysis": None, "message": "AI unavailable for What-If analysis.", "source": "ai_unavailable"}

    result["source"] = "ai"
    return result


@router.get("/history")
def get_ai_history(
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get historical AI insights."""
    insights = (
        db.query(AIInsight)
        .filter(AIInsight.user_id == user.id)
        .order_by(AIInsight.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "date": i.date,
            "analysis": i.analysis,
            "user_type": i.user_type,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in insights
    ]

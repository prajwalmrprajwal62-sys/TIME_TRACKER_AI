# ============================================
# TimeForge Backend — Weekly Review Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import json

from database import get_db
from models import WeeklyReview, TimeLog, StreakHistory, UserRewards
from schemas import WeeklyReviewCreate, WeeklyReviewResponse
from auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Weekly Reviews"])


def get_week_start(date_str: str = None) -> str:
    """Get Monday of the current week (or week containing date_str)."""
    if date_str:
        d = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        d = datetime.now()
    monday = d - timedelta(days=d.weekday())
    return monday.strftime("%Y-%m-%d")


def compute_week_summary(user_id: int, week_start: str, db: Session) -> dict:
    """Compute summary metrics for a given week."""
    start = datetime.strptime(week_start, "%Y-%m-%d")
    dates = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    logs = db.query(TimeLog).filter(
        TimeLog.user_id == user_id,
        TimeLog.date.in_(dates)
    ).all()

    # Wasted categories
    wasted_cats = {"Dopamine", "Fake Rest", "Avoidance"}
    productive_cats = {"Deep Work", "College", "Skill Building", "Exercise"}

    total_deep_work = 0
    total_wasted = 0
    total_productive = 0
    total_all = 0
    daily_data = {}
    friction_counts = {}

    for log in logs:
        total_all += log.duration
        if log.category in productive_cats:
            total_productive += log.duration
        if log.category == "Deep Work":
            total_deep_work += log.duration
        if log.category in wasted_cats:
            total_wasted += log.duration

        # Track daily deep work for best/worst day
        if log.date not in daily_data:
            daily_data[log.date] = {"deep_work": 0, "wasted": 0, "count": 0}
        if log.category == "Deep Work":
            daily_data[log.date]["deep_work"] += log.duration
        if log.category in wasted_cats:
            daily_data[log.date]["wasted"] += log.duration
        daily_data[log.date]["count"] += 1

        # Friction tracking
        if log.friction_reason:
            friction_counts[log.friction_reason] = friction_counts.get(log.friction_reason, 0) + 1

    # Best/worst day
    best_day = max(daily_data.items(), key=lambda x: x[1]["deep_work"], default=(None, {}))
    worst_day = max(daily_data.items(), key=lambda x: x[1]["wasted"], default=(None, {}))

    # Compliance from streak history
    streaks = db.query(StreakHistory).filter(
        StreakHistory.user_id == user_id,
        StreakHistory.date.in_(dates)
    ).all()
    compliance_scores = [s.compliance_score for s in streaks] if streaks else [0]
    avg_compliance = round(sum(compliance_scores) / max(len(compliance_scores), 1))

    # Current streak
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user_id).first()
    current_streak = rewards.current_streak if rewards else 0

    # Top friction trigger
    top_friction = max(friction_counts.items(), key=lambda x: x[1], default=(None, 0))

    return {
        "total_deep_work": total_deep_work,
        "total_productive": total_productive,
        "total_wasted": total_wasted,
        "total_logged": total_all,
        "avg_compliance": avg_compliance,
        "current_streak": current_streak,
        "log_count": len(logs),
        "days_logged": len(daily_data),
        "best_day": best_day[0] if best_day[0] else "N/A",
        "best_day_deep_work": best_day[1].get("deep_work", 0) if best_day[0] else 0,
        "worst_day": worst_day[0] if worst_day[0] else "N/A",
        "worst_day_wasted": worst_day[1].get("wasted", 0) if worst_day[0] else 0,
        "top_friction_trigger": top_friction[0] or "None",
        "top_friction_count": top_friction[1],
        "category_breakdown": {
            cat: sum(l.duration for l in logs if l.category == cat)
            for cat in set(l.category for l in logs)
        },
    }


@router.get("/weekly/current", response_model=WeeklyReviewResponse)
def get_current_weekly_review(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current week's review (or create a stub with computed summary)."""
    week_start = get_week_start()

    review = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.week_start_date == week_start,
    ).first()

    if not review:
        # Create a stub with computed summary
        summary = compute_week_summary(user.id, week_start, db)
        review = WeeklyReview(
            user_id=user.id,
            week_start_date=week_start,
            summary_json=json.dumps(summary),
        )
        db.add(review)
        db.commit()
        db.refresh(review)

    return review


@router.post("/weekly", response_model=WeeklyReviewResponse)
def submit_weekly_review(
    data: WeeklyReviewCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit or update the weekly review."""
    review = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.week_start_date == data.week_start_date,
    ).first()

    # Compute fresh summary
    summary = compute_week_summary(user.id, data.week_start_date, db)

    if review:
        review.summary_json = json.dumps(summary)
        review.reflection_text = data.reflection_text
        review.focus_area = data.focus_area
        review.wins = json.dumps(data.wins)
        review.rating = data.rating
        review.completed_at = datetime.utcnow()
    else:
        review = WeeklyReview(
            user_id=user.id,
            week_start_date=data.week_start_date,
            summary_json=json.dumps(summary),
            reflection_text=data.reflection_text,
            focus_area=data.focus_area,
            wins=json.dumps(data.wins),
            rating=data.rating,
            completed_at=datetime.utcnow(),
        )
        db.add(review)

    db.commit()
    db.refresh(review)

    # Award XP for completing review
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user.id).first()
    if rewards:
        rewards.xp += 100  # 100 XP for weekly review
        db.commit()

    return review


@router.get("/weekly/history")
def get_review_history(
    limit: int = 12,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get past weekly reviews for trend tracking."""
    reviews = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.completed_at.isnot(None),
    ).order_by(desc(WeeklyReview.week_start_date)).limit(limit).all()

    return [
        {
            "week_start_date": r.week_start_date,
            "summary": r.summary,
            "focus_area": r.focus_area,
            "rating": r.rating,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in reviews
    ]

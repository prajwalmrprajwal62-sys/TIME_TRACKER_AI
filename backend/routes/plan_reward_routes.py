# ============================================
# TimeForge Backend — Plan & Reward Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from database import get_db
from models import User, DailyPlan, UserRewards, StreakHistory
from schemas import PlanSave, PlanResponse, RewardsResponse, ProcessDayRequest
from auth import get_current_user

plan_router = APIRouter(prefix="/api/plans", tags=["Plans"])
reward_router = APIRouter(prefix="/api/rewards", tags=["Rewards"])


# === Plan Routes ===

@plan_router.post("", response_model=PlanResponse)
def save_plan(data: PlanSave, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Upsert: replace if plan exists for this date
    existing = db.query(DailyPlan).filter(DailyPlan.user_id == user.id, DailyPlan.date == data.date).first()
    if existing:
        existing.plan_json = data.plan_json
        existing.generated_by = data.generated_by
        db.commit()
        db.refresh(existing)
        return PlanResponse.model_validate(existing)

    plan = DailyPlan(user_id=user.id, date=data.date, plan_json=data.plan_json, generated_by=data.generated_by)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return PlanResponse.model_validate(plan)


@plan_router.get("/{date}", response_model=PlanResponse)
def get_plan(date: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == user.id, DailyPlan.date == date).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No plan for this date")
    return PlanResponse.model_validate(plan)


@plan_router.get("", response_model=List[PlanResponse])
def get_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = db.query(DailyPlan).filter(DailyPlan.user_id == user.id).order_by(DailyPlan.date.desc()).limit(14).all()
    return [PlanResponse.model_validate(p) for p in plans]


# === Reward Routes ===

@reward_router.get("", response_model=RewardsResponse)
def get_rewards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user.id).first()
    if not rewards:
        rewards = UserRewards(user_id=user.id)
        db.add(rewards)
        db.commit()
        db.refresh(rewards)

    return RewardsResponse(
        xp=rewards.xp,
        level=rewards.level,
        level_name=rewards.level_name,
        achievements=rewards.achievements,
        current_streak=rewards.current_streak,
        best_streak=rewards.best_streak,
    )


@reward_router.post("/process-day")
def process_day(data: ProcessDayRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sync end-of-day processing results from frontend."""
    # Update rewards
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user.id).first()
    if not rewards:
        rewards = UserRewards(user_id=user.id)
        db.add(rewards)

    rewards.xp += data.xp_earned
    rewards.level = data.level
    rewards.level_name = data.level_name
    rewards.current_streak = data.streak_current
    rewards.best_streak = max(rewards.best_streak, data.streak_best)

    # Merge achievements
    current_achievements = rewards.achievements
    for ach in data.achievements:
        if ach not in current_achievements:
            current_achievements.append(ach)
    rewards.achievements_json = json.dumps(current_achievements)

    # Save streak history
    existing_streak = db.query(StreakHistory).filter(
        StreakHistory.user_id == user.id, StreakHistory.date == data.date
    ).first()
    if existing_streak:
        existing_streak.compliance_score = data.compliance_score
        existing_streak.deep_work_minutes = data.deep_work_minutes
        existing_streak.wasted_minutes = data.wasted_minutes
    else:
        streak = StreakHistory(
            user_id=user.id, date=data.date,
            compliance_score=data.compliance_score,
            deep_work_minutes=data.deep_work_minutes,
            wasted_minutes=data.wasted_minutes,
        )
        db.add(streak)

    db.commit()
    return {"detail": "Day processed", "xp_total": rewards.xp, "level": rewards.level}


@reward_router.post("/sync")
def sync_rewards(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Full rewards sync from localStorage."""
    rewards = db.query(UserRewards).filter(UserRewards.user_id == user.id).first()
    if not rewards:
        rewards = UserRewards(user_id=user.id)
        db.add(rewards)

    rewards.xp = data.get("xp", rewards.xp)
    rewards.level = data.get("level", rewards.level)
    rewards.level_name = data.get("levelName", rewards.level_name)
    rewards.current_streak = data.get("currentStreak", rewards.current_streak)
    rewards.best_streak = data.get("bestStreak", rewards.best_streak)
    rewards.achievements_json = json.dumps(data.get("achievements", []))

    db.commit()
    return {"detail": "Rewards synced"}

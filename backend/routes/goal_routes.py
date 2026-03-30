# ============================================
# TimeForge Backend — Goal Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Goal
from schemas import GoalCreate, GoalResponse, GoalUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals"])


@router.post("", response_model=GoalResponse)
def create_goal(data: GoalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = Goal(user_id=user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return GoalResponse.model_validate(goal)


@router.get("", response_model=List[GoalResponse])
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.created_at.desc()).all()
    return [GoalResponse.model_validate(g) for g in goals]


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, data: GoalUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return GoalResponse.model_validate(goal)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"detail": "Goal deleted"}

# ============================================
# TimeForge Backend — Log Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, TimeLog
from schemas import TimeLogCreate, TimeLogResponse, TimeLogUpdate, BulkLogSync, DailySummaryResponse
from auth import get_current_user

router = APIRouter(prefix="/api/logs", tags=["Time Logs"])


@router.post("", response_model=TimeLogResponse)
def create_log(data: TimeLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = TimeLog(
        user_id=user.id,
        activity=data.activity,
        category=data.category,
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration,
        mood=data.mood,
        energy=data.energy,
        notes=data.notes,
        date=data.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return TimeLogResponse.model_validate(log)


@router.get("", response_model=List[TimeLogResponse])
def get_logs(
    date: Optional[str] = Query(None, description="Filter by date YYYY-MM-DD"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimeLog).filter(TimeLog.user_id == user.id)
    if date:
        query = query.filter(TimeLog.date == date)
    logs = query.order_by(TimeLog.date.desc(), TimeLog.start_time.asc()).all()
    return [TimeLogResponse.model_validate(l) for l in logs]


@router.get("/range", response_model=List[TimeLogResponse])
def get_logs_range(
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(TimeLog)
        .filter(TimeLog.user_id == user.id, TimeLog.date >= start, TimeLog.date <= end)
        .order_by(TimeLog.date.asc(), TimeLog.start_time.asc())
        .all()
    )
    return [TimeLogResponse.model_validate(l) for l in logs]


@router.get("/summary/{date}", response_model=DailySummaryResponse)
def get_daily_summary(date: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = (
        db.query(TimeLog)
        .filter(TimeLog.user_id == user.id, TimeLog.date == date)
        .order_by(TimeLog.start_time.asc())
        .all()
    )

    categories = {}
    productive_cats = {"Deep Work", "College"}
    wasted_cats = {"Dopamine", "Fake Rest", "Avoidance"}

    total_minutes = 0
    productive_minutes = 0
    wasted_minutes = 0
    mood_sum = 0
    energy_sum = 0

    for log in logs:
        if log.category not in categories:
            categories[log.category] = {"minutes": 0, "count": 0}
        categories[log.category]["minutes"] += log.duration
        categories[log.category]["count"] += 1
        total_minutes += log.duration
        mood_sum += log.mood
        energy_sum += log.energy

        if log.category in productive_cats:
            productive_minutes += log.duration
        elif log.category in wasted_cats:
            wasted_minutes += log.duration

    count = len(logs)
    return DailySummaryResponse(
        date=date,
        total_minutes=total_minutes,
        productive_minutes=productive_minutes,
        wasted_minutes=wasted_minutes,
        log_count=count,
        categories=categories,
        avg_mood=round(mood_sum / count, 1) if count > 0 else 0,
        avg_energy=round(energy_sum / count, 1) if count > 0 else 0,
    )


@router.put("/{log_id}", response_model=TimeLogResponse)
def update_log(
    log_id: int,
    data: TimeLogUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(TimeLog).filter(TimeLog.id == log_id, TimeLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return TimeLogResponse.model_validate(log)


@router.delete("/{log_id}")
def delete_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = db.query(TimeLog).filter(TimeLog.id == log_id, TimeLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"detail": "Log deleted"}


@router.post("/sync")
def sync_logs(data: BulkLogSync, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Bulk sync logs from localStorage to database."""
    created = 0
    skipped = 0

    for log_data in data.logs:
        # Check if log already exists (same date, start_time, activity)
        existing = (
            db.query(TimeLog)
            .filter(
                TimeLog.user_id == user.id,
                TimeLog.date == log_data.date,
                TimeLog.start_time == log_data.start_time,
                TimeLog.activity == log_data.activity,
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        log = TimeLog(user_id=user.id, **log_data.model_dump())
        db.add(log)
        created += 1

    db.commit()
    return {"created": created, "skipped": skipped, "total": len(data.logs)}

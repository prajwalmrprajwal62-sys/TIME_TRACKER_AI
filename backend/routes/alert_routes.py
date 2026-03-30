# ============================================
# TimeForge Backend — Drift Alert Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from database import get_db
from models import DriftAlert, TimeLog, StreakHistory, UserRewards
from schemas import DriftAlertResponse
from auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Drift Alerts"])

# Wasted / productive category sets
WASTED_CATS = {"Dopamine", "Fake Rest", "Avoidance"}
PRODUCTIVE_CATS = {"Deep Work", "College", "Skill Building", "Exercise"}


def check_drift(user_id: int, db: Session) -> list:
    """Run drift detection checks and return any new alerts."""
    today = datetime.now().strftime("%Y-%m-%d")
    now_hour = datetime.now().hour
    alerts = []

    # Don't generate alerts before 2 PM (let user have their morning)
    if now_hour < 14:
        return alerts

    # Check if we already sent an alert today
    existing_today = db.query(DriftAlert).filter(
        DriftAlert.user_id == user_id,
        DriftAlert.created_at >= datetime.now().replace(hour=0, minute=0, second=0),
    ).count()
    if existing_today >= 1:
        return alerts  # Max 1 alert per day

    # --- Check 1: Low deep work today ---
    today_logs = db.query(TimeLog).filter(
        TimeLog.user_id == user_id,
        TimeLog.date == today,
    ).all()

    today_deep_work = sum(l.duration for l in today_logs if l.category == "Deep Work")

    # Get 7-day baseline
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    week_logs = db.query(TimeLog).filter(
        TimeLog.user_id == user_id,
        TimeLog.date >= week_ago,
        TimeLog.date < today,
    ).all()

    if week_logs:
        # Compute avg daily deep work over past 7 days
        daily_dw = {}
        for l in week_logs:
            if l.category == "Deep Work":
                daily_dw[l.date] = daily_dw.get(l.date, 0) + l.duration
        if daily_dw:
            avg_daily_dw = sum(daily_dw.values()) / len(daily_dw)
            # If today's deep work is less than 30% of average and it's past 6 PM
            if now_hour >= 18 and today_deep_work < avg_daily_dw * 0.3 and avg_daily_dw > 30:
                alerts.append({
                    "alert_type": "low_deep_work",
                    "message": f"It's {now_hour}:00 and you've done only {today_deep_work}min of deep work today (your average is {int(avg_daily_dw)}min). Want a rescue plan?",
                    "severity": "warning",
                })

    # --- Check 2: Compliance declining 3+ days ---
    recent_streaks = db.query(StreakHistory).filter(
        StreakHistory.user_id == user_id,
    ).order_by(desc(StreakHistory.date)).limit(5).all()

    if len(recent_streaks) >= 3:
        scores = [s.compliance_score for s in recent_streaks[:3]]
        # Declining pattern: each day lower than previous
        if scores[0] < scores[1] < scores[2] and scores[0] < 50:
            alerts.append({
                "alert_type": "streak_risk",
                "message": f"Your compliance has dropped 3 days in a row ({scores[2]}% → {scores[1]}% → {scores[0]}%). Your streak is at risk. Let's turn this around TODAY.",
                "severity": "critical",
            })

    # --- Check 3: Dopamine spiral (wasted time spiking) ---
    if len(recent_streaks) >= 3:
        wasted_by_day = {}
        for l in week_logs:
            if l.category in WASTED_CATS:
                wasted_by_day[l.date] = wasted_by_day.get(l.date, 0) + l.duration
        if wasted_by_day:
            sorted_days = sorted(wasted_by_day.items(), key=lambda x: x[0], reverse=True)
            if len(sorted_days) >= 3:
                recent_3 = [v for _, v in sorted_days[:3]]
                if recent_3[0] > recent_3[1] > recent_3[2] and recent_3[0] > 60:
                    alerts.append({
                        "alert_type": "dopamine_spiral",
                        "message": f"⚠️ Dopamine spiral detected. Your wasted time has increased 3 days straight ({recent_3[2]}min → {recent_3[1]}min → {recent_3[0]}min). Time to break the pattern.",
                        "severity": "critical",
                    })

    # --- Check 4: Burnout risk (low energy + high avoidance) ---
    if today_logs:
        avg_energy = sum(l.energy for l in today_logs) / len(today_logs)
        avoidance_time = sum(l.duration for l in today_logs if l.category == "Avoidance")
        if avg_energy <= 2.0 and avoidance_time > 60:
            alerts.append({
                "alert_type": "burnout",
                "message": f"Your energy is very low ({avg_energy:.1f}/5) and you've spent {avoidance_time}min avoiding tasks. This looks like burnout — consider taking a REAL break today.",
                "severity": "warning",
            })

    # Save alerts to DB
    saved = []
    for a in alerts[:1]:  # Max 1 per day
        alert = DriftAlert(
            user_id=user_id,
            alert_type=a["alert_type"],
            message=a["message"],
            severity=a["severity"],
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        saved.append(alert)

    return saved


@router.get("/pending")
def get_pending_alerts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get unacknowledged alerts + run drift detection."""
    # Run drift check (generates new alerts if conditions met)
    new_alerts = check_drift(user.id, db)

    # Fetch all pending (unacknowledged) alerts
    pending = db.query(DriftAlert).filter(
        DriftAlert.user_id == user.id,
        DriftAlert.acknowledged == 0,
    ).order_by(desc(DriftAlert.created_at)).limit(5).all()

    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "message": a.message,
            "severity": a.severity,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in pending
    ]


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    action: str = "seen",  # "seen" or "snoozed"
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Acknowledge or snooze a drift alert."""
    alert = db.query(DriftAlert).filter(
        DriftAlert.id == alert_id,
        DriftAlert.user_id == user.id,
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = 1 if action == "seen" else 2
    db.commit()

    return {"status": "ok", "acknowledged": alert.acknowledged}

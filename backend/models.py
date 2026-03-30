# ============================================
# TimeForge Backend — Database Models (v3.0)
# ============================================

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import json


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    wake_time = Column(String(5), default="07:00")
    sleep_time = Column(String(5), default="23:00")
    role = Column(String(20), default="student")  # student/professional/other — for benchmarks
    goals_text = Column(Text, default="[]")  # JSON array of goal strings from onboarding
    settings_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    logs = relationship("TimeLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    plans = relationship("DailyPlan", back_populates="user", cascade="all, delete-orphan")
    rewards = relationship("UserRewards", back_populates="user", uselist=False, cascade="all, delete-orphan")
    streak_history = relationship("StreakHistory", back_populates="user", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="user", cascade="all, delete-orphan")
    weekly_reviews = relationship("WeeklyReview", back_populates="user", cascade="all, delete-orphan")
    accountability_partners = relationship("AccountabilityPartner", back_populates="user", cascade="all, delete-orphan")

    @property
    def onboarding_goals(self):
        try:
            return json.loads(self.goals_text)
        except:
            return []

    @property
    def settings(self):
        try:
            return json.loads(self.settings_json)
        except:
            return {}


class TimeLog(Base):
    __tablename__ = "time_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    start_time = Column(String(5), nullable=False)  # HH:MM
    end_time = Column(String(5), nullable=False)  # HH:MM
    duration = Column(Integer, nullable=False)  # minutes
    mood = Column(Integer, default=3)  # 1-5
    energy = Column(Integer, default=3)  # 1-5
    notes = Column(Text, default="")
    friction_reason = Column(String(50), nullable=True)  # bored/stuck/tired/autopilot/emotional/other
    friction_text = Column(Text, nullable=True)  # free text when "other"
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="logs")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    type = Column(String(50), default="General")
    deadline = Column(String(10), nullable=True)  # YYYY-MM-DD
    daily_effort = Column(Float, default=2.0)
    progress = Column(Integer, default=0)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="active")  # active/completed/archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False, index=True)
    plan_json = Column(Text, nullable=False)  # JSON array of plan blocks
    generated_by = Column(String(20), default="manual")  # manual/rule/ai
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="plans")

    @property
    def plan(self):
        try:
            return json.loads(self.plan_json)
        except:
            return []


class StreakHistory(Base):
    __tablename__ = "streak_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False, index=True)
    compliance_score = Column(Integer, default=0)
    deep_work_minutes = Column(Integer, default=0)
    wasted_minutes = Column(Integer, default=0)

    user = relationship("User", back_populates="streak_history")


class UserRewards(Base):
    __tablename__ = "user_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    level_name = Column(String(50), default="Novice")
    achievements_json = Column(Text, default="[]")
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)

    user = relationship("User", back_populates="rewards")

    @property
    def achievements(self):
        try:
            return json.loads(self.achievements_json)
        except:
            return []


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False, index=True)
    analysis_json = Column(Text, nullable=False)
    user_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_insights")

    @property
    def analysis(self):
        try:
            return json.loads(self.analysis_json)
        except:
            return {}


# =============================================
# NEW MODELS (v3.0)
# =============================================

class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date = Column(String(10), nullable=False, index=True)  # Monday YYYY-MM-DD
    summary_json = Column(Text, default="{}")  # Cached metrics: deep_work, wasted, compliance, etc.
    reflection_text = Column(Text, default="")  # User's written reflection
    focus_area = Column(String(255), default="")  # ONE focus for next week
    wins = Column(Text, default="[]")  # JSON array of user-identified wins
    rating = Column(Integer, default=3)  # 1-5: How do you feel about this week?
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="weekly_reviews")

    @property
    def summary(self):
        try:
            return json.loads(self.summary_json)
        except:
            return {}


class AccountabilityPartner(Base):
    __tablename__ = "accountability_partners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    partner_email = Column(String(255), nullable=False)
    partner_name = Column(String(100), default="")
    status = Column(String(20), default="pending")  # pending/active/blocked
    permissions_json = Column(Text, default='{"daily_summary":true,"weekly_report":true,"streak_alert":true}')
    invite_code = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="accountability_partners")

    @property
    def permissions(self):
        try:
            return json.loads(self.permissions_json)
        except:
            return {}


class BenchmarkSnapshot(Base):
    __tablename__ = "benchmark_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    segment = Column(String(20), nullable=False, index=True)  # "student" or "professional"
    date = Column(String(10), nullable=False, index=True)
    metrics_json = Column(Text, nullable=False)
    # metrics_json: avg_deep_work, avg_wasted, avg_compliance, avg_streak, user_count
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def metrics(self):
        try:
            return json.loads(self.metrics_json)
        except:
            return {}


class DriftAlert(Base):
    __tablename__ = "drift_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # low_deep_work, streak_risk, dopamine_spiral, burnout
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="warning")  # info, warning, critical
    acknowledged = Column(Integer, default=0)  # 0=pending, 1=seen, 2=snoozed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

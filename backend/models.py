# ============================================
# TimeForge Backend — Database Models
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False, index=True)
    plan_json = Column(Text, nullable=False)  # JSON array of plan blocks
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

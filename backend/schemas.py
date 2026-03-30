# ============================================
# TimeForge Backend — Pydantic Schemas
# ============================================

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# === Auth ===
class UserRegister(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: int
    email: str
    name: str
    wake_time: str
    sleep_time: str
    goals_text: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    goals_text: Optional[str] = None
    settings_json: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# === Time Logs ===
class TimeLogCreate(BaseModel):
    activity: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., max_length=50)
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    duration: int = Field(..., gt=0)
    mood: int = Field(default=3, ge=1, le=5)
    energy: int = Field(default=3, ge=1, le=5)
    notes: str = Field(default="", max_length=1000)
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')

class TimeLogResponse(BaseModel):
    id: int
    activity: str
    category: str
    start_time: str
    end_time: str
    duration: int
    mood: int
    energy: int
    notes: str
    date: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TimeLogUpdate(BaseModel):
    activity: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[int] = None
    mood: Optional[int] = None
    energy: Optional[int] = None
    notes: Optional[str] = None

class BulkLogSync(BaseModel):
    logs: List[TimeLogCreate]


# === Goals ===
class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="General", max_length=50)
    deadline: Optional[str] = None
    daily_effort: float = Field(default=2.0, gt=0, le=16)
    progress: int = Field(default=0, ge=0, le=100)
    priority: str = Field(default="medium")

class GoalResponse(BaseModel):
    id: int
    title: str
    type: str
    deadline: Optional[str]
    daily_effort: float
    progress: int
    priority: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    deadline: Optional[str] = None
    daily_effort: Optional[float] = None
    progress: Optional[int] = None
    priority: Optional[str] = None


# === Plans ===
class PlanSave(BaseModel):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    plan_json: str  # JSON string of plan blocks

class PlanResponse(BaseModel):
    id: int
    date: str
    plan_json: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === Rewards ===
class RewardsResponse(BaseModel):
    xp: int
    level: int
    level_name: str
    achievements: list
    current_streak: int
    best_streak: int

class ProcessDayRequest(BaseModel):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    xp_earned: int = Field(default=0, ge=0)
    compliance_score: int = Field(default=0, ge=0, le=100)
    achievements: List[str] = Field(default=[])
    streak_current: int = Field(default=0, ge=0)
    streak_best: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    level_name: str = Field(default="Novice")


# === AI ===
class AIAnalysisResponse(BaseModel):
    analysis: dict
    user_type: Optional[str]
    date: str
    source: str  # "ai" or "cached"

class DailySummaryResponse(BaseModel):
    date: str
    total_minutes: int
    productive_minutes: int
    wasted_minutes: int
    log_count: int
    categories: dict
    avg_mood: float
    avg_energy: float


# === Full State Sync ===
class FullStateSync(BaseModel):
    """For syncing entire localStorage state to backend."""
    user: Optional[dict] = None
    logs: Optional[List[TimeLogCreate]] = None
    goals: Optional[List[GoalCreate]] = None
    plans: Optional[dict] = None
    rewards: Optional[dict] = None
    streaks: Optional[dict] = None

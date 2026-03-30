# ============================================
# TimeForge Backend — Auth Routes
# ============================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRewards
from schemas import UserRegister, UserLogin, TokenResponse, UserProfile, UserProfileUpdate
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create rewards record
    rewards = UserRewards(user_id=user.id)
    db.add(rewards)
    db.commit()

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserProfile.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserProfile.model_validate(user),
    )


@router.get("/me", response_model=UserProfile)
def get_me(user: User = Depends(get_current_user)):
    return UserProfile.model_validate(user)


@router.put("/profile", response_model=UserProfile)
def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        user.name = data.name
    if data.wake_time is not None:
        user.wake_time = data.wake_time
    if data.sleep_time is not None:
        user.sleep_time = data.sleep_time
    if data.goals_text is not None:
        user.goals_text = data.goals_text
    if data.settings_json is not None:
        user.settings_json = data.settings_json

    db.commit()
    db.refresh(user)
    return UserProfile.model_validate(user)

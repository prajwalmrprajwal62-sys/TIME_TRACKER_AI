# ============================================
# TimeForge Backend — Main Entry Point
# ============================================

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    print("🔥 TimeForge Backend starting...")
    init_db()
    print("✅ Database initialized")
    yield
    print("👋 TimeForge Backend shutting down")


app = FastAPI(
    title="TimeForge API",
    description="Time Intelligence Engine — Backend API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS - explicit origins to avoid browser issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
from routes.auth_routes import router as auth_router
from routes.log_routes import router as log_router
from routes.goal_routes import router as goal_router
from routes.plan_reward_routes import plan_router, reward_router
from routes.ai_routes import router as ai_router

app.include_router(auth_router)
app.include_router(log_router)
app.include_router(goal_router)
app.include_router(plan_router)
app.include_router(reward_router)
app.include_router(ai_router)


@app.get("/api/health")
def health_check():
    from config import get_settings
    settings = get_settings()
    return {
        "status": "healthy",
        "version": "2.0.0",
        "ai_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here"),
    }

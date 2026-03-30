# ============================================
# TimeForge Backend — Main Entry Point
# ============================================

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("timeforge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    logger.info("🔥 TimeForge Backend starting...")
    init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("👋 TimeForge Backend shutting down")


app = FastAPI(
    title="TimeForge API",
    description="Time Intelligence Engine — Backend API",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS - explicit origins, no wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://timeforge-app.netlify.app",  # Production Netlify
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — log all unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# Routes
from routes.auth_routes import router as auth_router
from routes.log_routes import router as log_router
from routes.goal_routes import router as goal_router
from routes.plan_reward_routes import plan_router, reward_router
from routes.ai_routes import router as ai_router
from routes.review_routes import router as review_router
from routes.alert_routes import router as alert_router

app.include_router(auth_router)
app.include_router(log_router)
app.include_router(goal_router)
app.include_router(plan_router)
app.include_router(reward_router)
app.include_router(ai_router)
app.include_router(review_router)
app.include_router(alert_router)


@app.get("/api/health")
def health_check():
    from config import get_settings
    from database import SessionLocal
    from sqlalchemy import text

    settings = get_settings()

    # DB connectivity check
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception as e:
        logger.error(f"Health check DB ping failed: {e}")

    status = "healthy" if db_ok else "degraded"
    return {
        "status": status,
        "version": "3.0.0",
        "db_connected": db_ok,
        "ai_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here"),
    }


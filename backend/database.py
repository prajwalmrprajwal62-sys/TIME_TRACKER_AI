# ============================================
# TimeForge Backend — Database Setup
# ============================================

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from config import get_settings

settings = get_settings()

# SQLite with WAL mode for better concurrency
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable WAL mode for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables on first run."""
    Base.metadata.create_all(bind=engine)

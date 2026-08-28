
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path


# =========================================
# DATABASE LOCATION
# =========================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_PATH = BASE_DIR / "lost_found.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# =========================================
# CREATE DATABASE ENGINE
# =========================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    }
)


# =========================================
# DATABASE SESSION
# =========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =========================================
# BASE MODEL
# =========================================

Base = declarative_base()

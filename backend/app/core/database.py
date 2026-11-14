from typing import Any, Dict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.base import Base

db_url = settings.DATABASE_URL

engine_kwargs: Dict[str, Any] = {
    "pool_pre_ping": True,
}

if "sqlite" not in db_url:
    engine_kwargs.update(
        {
            "pool_recycle": 300,
            "pool_size": 10,
            "max_overflow": 20,
        }
    )
else:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

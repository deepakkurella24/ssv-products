import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.core.firebase import init_firebase
from app.models.base import Base
# Import all models so that Base.metadata has full table definitions
import app.models  # noqa: F401

from app.routers.addresses import router as addresses_router
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.categories import router as categories_router
from app.routers.custom_requests import router as custom_requests_router
from app.routers.order import router as order_router
from app.routers.products import router as products_router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Firebase Admin SDK
    try:
        init_firebase()
    except Exception as exc:
        logger.warning("Firebase initialization notice: %s", exc)

    # 2. Automatically create all database tables using SQLAlchemy 2.0
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized via Base.metadata.create_all().")
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", exc)
        raise exc

    yield


app = FastAPI(
    title="SSV API",
    description="Backend API powering the Sri Samruddhi Vanam (SSV) Storefront and Admin Dashboard.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Middleware
origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {"status": "ok", "version": "2.0.0"}


# Register API Routers
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(addresses_router)
app.include_router(order_router)
app.include_router(custom_requests_router)
app.include_router(admin_router)

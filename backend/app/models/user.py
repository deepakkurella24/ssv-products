import uuid
from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    firebase_uid: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="customer", nullable=False)

    # Relationships
    addresses: Mapped[List["Address"]] = relationship(  # type: ignore
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship(  # type: ignore
        "CartItem", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(  # type: ignore
        "Order", back_populates="user"
    )
    custom_requests: Mapped[List["CustomRequest"]] = relationship(  # type: ignore
        "CustomRequest", back_populates="user"
    )
    reviews: Mapped[List["Review"]] = relationship(  # type: ignore
        "Review", back_populates="user"
    )

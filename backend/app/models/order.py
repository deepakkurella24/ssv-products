import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False
    )
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    expected_delivery: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    items: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    coupon_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    coupon_discount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(20), default="cod", nullable=False
    )
    amount_paid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    address: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_request_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("custom_requests.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")  # type: ignore
    source_request: Mapped[Optional["CustomRequest"]] = relationship(  # type: ignore
        "CustomRequest", foreign_keys=[source_request_id]
    )

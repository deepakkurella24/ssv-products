import uuid
from typing import Optional
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CustomRequest(Base):
    __tablename__ = "custom_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    contact: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_product: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    preferred_category_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    quantity_kg: Mapped[str] = mapped_column(String(50), nullable=False)
    customization_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="new", nullable=False)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quoted_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confirmed_order_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="SET NULL", use_alter=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="custom_requests")  # type: ignore
    preferred_category: Mapped[Optional["Category"]] = relationship("Category")  # type: ignore
    confirmed_order: Mapped[Optional["Order"]] = relationship(  # type: ignore
        "Order", foreign_keys=[confirmed_order_id]
    )

import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )
    user_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    variant_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verified_purchase: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")  # type: ignore
    user: Mapped["User"] = relationship("User", back_populates="reviews")  # type: ignore
    order: Mapped[Optional["Order"]] = relationship("Order")  # type: ignore

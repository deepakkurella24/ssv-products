import uuid
from typing import Any, List, Optional
from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(150), unique=True, index=True, nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    story: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("categories.id"), nullable=False
    )
    subcategory_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("categories.id"), nullable=True
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    gallery: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    shelf_life_months: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    ingredients: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    popularity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    category_rel: Mapped["Category"] = relationship(  # type: ignore
        "Category", foreign_keys=[category_id], back_populates="products"
    )
    subcategory_rel: Mapped[Optional["Category"]] = relationship(  # type: ignore
        "Category", foreign_keys=[subcategory_id]
    )
    variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(  # type: ignore
        "Review", back_populates="product", cascade="all, delete-orphan"
    )


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(50), nullable=False)
    weight_g: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="variants")

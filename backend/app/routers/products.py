from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.category import Category
from app.models.order import Order
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.product import (
    ProductDetailResponse,
    ProductListItem,
    ProductsResponse,
)
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/products", tags=["Storefront Products & Reviews"])


@router.get("/", response_model=ProductsResponse)
def get_products(
    category: Optional[str] = Query(default=None, description="Category slug or UUID"),
    sub: Optional[str] = Query(default=None, description="Subcategory slug or UUID"),
    query: Optional[str] = Query(default=None, description="Search term for name or description"),
    sort: Optional[str] = Query(default="best", description="Sort order: best, price_asc, price_desc"),
    limit: Optional[int] = Query(default=None, ge=1, le=100),
    offset: Optional[int] = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Lists storefront catalog products with filtering, search, sorting, and pagination."""
    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.available.is_(True))
    )

    if sub:
        sub_cat = db.scalar(
            select(Category).where(or_(Category.slug == sub, Category.id == sub))
        )
        if sub_cat:
            statement = statement.where(Product.subcategory_id == sub_cat.id)
        else:
            return ProductsResponse(products=[], total=0)
    elif category:
        cat = db.scalar(
            select(Category)
            .options(selectinload(Category.subcategories))
            .where(or_(Category.slug == category, Category.id == category))
        )
        if cat:
            sub_ids = [s.id for s in cat.subcategories]
            conditions = [Product.category_id == cat.id]
            if sub_ids:
                conditions.append(Product.subcategory_id.in_(sub_ids))
            statement = statement.where(or_(*conditions))
        else:
            return ProductsResponse(products=[], total=0)

    if query and query.strip():
        term = f"%{query.strip()}%"
        statement = statement.where(
            or_(Product.name.ilike(term), Product.description.ilike(term))
        )

    all_matched = list(db.scalars(statement).all())
    total_count = len(all_matched)

    # Sort in memory based on variant pricing or popularity
    def get_lowest_price(p: Product) -> int:
        if not p.variants:
            return 0
        active_prices = [v.price for v in p.variants if v.available]
        return min(active_prices) if active_prices else min(v.price for v in p.variants)

    sort_lower = (sort or "best").lower().strip()
    if sort_lower in ("price_asc", "price-asc"):
        all_matched.sort(key=get_lowest_price)
    elif sort_lower in ("price_desc", "price-desc"):
        all_matched.sort(key=get_lowest_price, reverse=True)
    else:  # "best"
        all_matched.sort(key=lambda p: (p.popularity, p.name), reverse=True)

    # Apply pagination
    if limit is not None:
        paginated_products = all_matched[offset : offset + limit]
    else:
        paginated_products = all_matched[offset:]

    return ProductsResponse(products=paginated_products, total=total_count)


@router.get("/{id_or_slug}", response_model=ProductDetailResponse)
def get_product_detail(id_or_slug: str, db: Session = Depends(get_db)):
    """Loads complete product specifications, image gallery, variants, and ingredients."""
    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(
            or_(Product.id == id_or_slug, Product.slug == id_or_slug),
            Product.available.is_(True),
        )
    )
    product = db.scalar(statement)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found",
        )
    return product


@router.get("/{id_or_slug}/related", response_model=List[ProductListItem])
def get_related_products(
    id_or_slug: str,
    limit: int = Query(default=4, ge=1, le=10),
    db: Session = Depends(get_db),
):
    """Displays complementary products from the same category on the Product Detail Page."""
    current = db.scalar(
        select(Product).where(or_(Product.id == id_or_slug, Product.slug == id_or_slug))
    )
    if not current:
        return []

    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(
            Product.id != current.id,
            Product.available.is_(True),
        )
    )

    if current.subcategory_id:
        statement = statement.where(
            or_(
                Product.subcategory_id == current.subcategory_id,
                Product.category_id == current.category_id,
            )
        )
    else:
        statement = statement.where(Product.category_id == current.category_id)

    related = list(db.scalars(statement.order_by(Product.popularity.desc()).limit(limit)).all())
    return related


@router.get("/{id_or_slug}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(id_or_slug: str, db: Session = Depends(get_db)):
    """Fetches customer reviews for a given product."""
    product = db.scalar(
        select(Product).where(or_(Product.id == id_or_slug, Product.slug == id_or_slug))
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found",
        )

    reviews = list(
        db.scalars(
            select(Review)
            .where(Review.product_id == product.id)
            .order_by(Review.created_at.desc())
        ).all()
    )
    return reviews


@router.post(
    "/{id_or_slug}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_review(
    id_or_slug: str,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits a star rating and written review. Requires verified delivered purchase."""
    product = db.scalar(
        select(Product).where(or_(Product.id == id_or_slug, Product.slug == id_or_slug))
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found",
        )

    # Verify user has at least one delivered order containing this product_id
    delivered_orders = list(
        db.scalars(
            select(Order).where(
                Order.user_id == current_user.id,
                Order.status == "delivered",
            )
        ).all()
    )

    verified_buyer = False
    matching_order_id = payload.order_id
    for ord_obj in delivered_orders:
        items = ord_obj.items or []
        for it in items:
            if it.get("product_id") == product.id:
                verified_buyer = True
                if not matching_order_id:
                    matching_order_id = ord_obj.id
                break
        if verified_buyer and payload.order_id:
            break

    if not verified_buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified buyers who have received this product can submit a review.",
        )

    review = Review(
        product_id=product.id,
        user_id=current_user.id,
        order_id=matching_order_id,
        user_name=payload.user_name,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
        variant_label=payload.variant_label,
        verified_purchase=True,
        images=payload.images,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

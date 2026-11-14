from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.dependencies.db import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryResponse, SubcategoryItem

router = APIRouter(prefix="/categories", tags=["Storefront Catalog"])


def build_category_response(category: Category, db: Session) -> CategoryResponse:
    subcategories_data: List[SubcategoryItem] = []
    sub_ids: List[str] = []

    for sub in category.subcategories:
        sub_ids.append(sub.id)
        # Count products for subcategory
        sub_p_count = db.scalar(
            select(func.count(Product.id)).where(
                Product.subcategory_id == sub.id,
                Product.available.is_(True),
            )
        ) or 0
        subcategories_data.append(
            SubcategoryItem(
                id=sub.id,
                name=sub.name,
                slug=sub.slug,
                description=sub.description,
                parent_id=sub.parent_id,
                display_order=sub.display_order,
                product_count=sub_p_count,
            )
        )

    # Count products for parent category
    parent_condition = [Product.category_id == category.id]
    if sub_ids:
        parent_condition.append(Product.subcategory_id.in_(sub_ids))

    product_count = db.scalar(
        select(func.count(Product.id)).where(
            or_(*parent_condition),
            Product.available.is_(True),
        )
    ) or 0

    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        image_url=category.image_url,
        parent_id=category.parent_id,
        display_order=category.display_order,
        product_count=product_count,
        subcategories=subcategories_data,
    )


@router.get("/", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Powers storefront navigation, MegaMenu, and category taxonomy."""
    statement = (
        select(Category)
        .options(selectinload(Category.subcategories))
        .where(Category.parent_id.is_(None))
        .order_by(Category.display_order)
    )
    root_categories = list(db.scalars(statement).all())
    return [build_category_response(cat, db) for cat in root_categories]


@router.get("/{id_or_slug}", response_model=CategoryResponse)
def get_category_by_id_or_slug(id_or_slug: str, db: Session = Depends(get_db)):
    """Retrieves specific category details and its child subcategories by UUID or slug."""
    statement = (
        select(Category)
        .options(selectinload(Category.subcategories))
        .where(or_(Category.id == id_or_slug, Category.slug == id_or_slug))
    )
    category = db.scalar(statement)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{id_or_slug}' not found",
        )
    return build_category_response(category, db)

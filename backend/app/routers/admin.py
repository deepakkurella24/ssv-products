import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.dependencies.auth import require_admin
from app.dependencies.db import get_db
from app.models.address import Address
from app.models.cart import CartItem
from app.models.category import Category
from app.models.coupon import Coupon
from app.models.custom_request import CustomRequest
from app.models.order import Order
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.routers.categories import build_category_response
from app.schemas.address import AddressCreate, AddressResponse
from app.schemas.analytics import AnalyticsResponse
from app.schemas.category import (
    CategoryCreate,
    CategoryReorder,
    CategoryResponse,
    CategoryUpdate,
)
from app.schemas.coupon import CouponCreate, CouponResponse, CouponToggle, CouponUpdate
from app.schemas.custom_request import (
    AdminCustomRequestCustomerDetail,
    AdminCustomRequestCustomerSummary,
    AdminCustomRequestDetail,
    AdminCustomRequestListItem,
    AdminCustomRequestUpdate,
    CustomRequestConfirm,
)
from app.schemas.order import (
    AdminCountsResponse,
    AdminOrderCustomerDetail,
    AdminOrderCustomerSummary,
    AdminOrderDetailResponse,
    AdminOrderItemSummary,
    AdminOrderListItem,
    AdminOrderUpdate,
    OrderDetailResponse,
)
from app.schemas.product import (
    AdminProductSummary,
    AdminProductsResponse,
    ProductCreate,
    ProductDetailResponse,
    ProductUpdate,
    VariantResponse,
)
from app.services.analytics_service import get_analytics_data
from app.services.order_service import confirm_custom_request_order

router = APIRouter(prefix="/admin", tags=["Admin Console"])


def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug)


# ---------------------------------------------------------------------------
# 1. Dashboard Metrics
# ---------------------------------------------------------------------------
@router.get("/counts", response_model=AdminCountsResponse)
def get_dashboard_counts(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns real-time badge counts for pending orders and unreviewed custom requests."""
    pending_orders = db.scalar(
        select(func.count(Order.id)).where(Order.status == "pending")
    ) or 0
    new_requests = db.scalar(
        select(func.count(CustomRequest.id)).where(CustomRequest.status.in_(("new", "contacted")))
    ) or 0
    return AdminCountsResponse(
        pendingOrders=pending_orders,
        newRequests=new_requests,
    )


# ---------------------------------------------------------------------------
# 2. Order Management
# ---------------------------------------------------------------------------
@router.get("/order", response_model=List[AdminOrderListItem])
def get_admin_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin order list with live status filtering."""
    statement = (
        select(Order)
        .options(selectinload(Order.user))
        .order_by(Order.placed_at.desc())
    )
    if status_filter and status_filter.upper() != "ALL":
        statement = statement.where(Order.status == status_filter.lower())

    orders = list(db.scalars(statement).all())
    result = []
    for ord_obj in orders:
        cust_name = (
            ord_obj.address.get("name")
            if isinstance(ord_obj.address, dict) and ord_obj.address.get("name")
            else (ord_obj.user.name if ord_obj.user else "Customer")
        )
        item_summaries = [
            AdminOrderItemSummary(qty=it.get("qty", 1))
            for it in (ord_obj.items or [])
        ]
        result.append(
            AdminOrderListItem(
                id=ord_obj.id,
                customer=AdminOrderCustomerSummary(name=cust_name),
                placed_at=ord_obj.placed_at,
                expected_delivery=ord_obj.expected_delivery,
                delivered_at=ord_obj.delivered_at,
                status=ord_obj.status,
                total=ord_obj.total,
                amount_paid=ord_obj.amount_paid,
                payment_method=ord_obj.payment_method,
                items=item_summaries,
                source_request_id=ord_obj.source_request_id,
            )
        )
    return result


@router.get("/order/{id}", response_model=AdminOrderDetailResponse)
def get_admin_order_by_id(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Loads detailed order record for split-screen console view."""
    statement = select(Order).options(selectinload(Order.user)).where(Order.id == id)
    order = db.scalar(statement)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    addr = order.address or {}
    cust_name = addr.get("name") or (order.user.name if order.user else "Customer")
    cust_phone = addr.get("phone") or (order.user.phone if order.user else None)
    cust_email = order.user.email if order.user else None

    return AdminOrderDetailResponse(
        id=order.id,
        customer=AdminOrderCustomerDetail(
            name=cust_name,
            phone=cust_phone,
            email=cust_email,
        ),
        placed_at=order.placed_at,
        expected_delivery=order.expected_delivery,
        delivered_at=order.delivered_at,
        status=order.status,
        total=order.total,
        subtotal=order.subtotal,
        amount_paid=order.amount_paid,
        payment_method=order.payment_method,
        notes=order.notes,
        source_request_id=order.source_request_id,
        address=order.address,
        items=order.items,
    )


@router.patch("/order/{id}", response_model=AdminOrderDetailResponse)
def update_admin_order(
    id: str,
    payload: AdminOrderUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Updates status, records cash payment, or reschedules delivery date."""
    statement = select(Order).options(selectinload(Order.user)).where(Order.id == id)
    order = db.scalar(statement)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # 1. Update amount_paid if provided
    if payload.amount_paid is not None:
        order.amount_paid = payload.amount_paid

    # 2. Update expected_delivery if provided
    if payload.expected_delivery is not None:
        order.expected_delivery = payload.expected_delivery

    # 3. Status transition & payment enforcement
    if payload.status is not None:
        new_status = payload.status.lower()
        if new_status == "delivered":
            if order.amount_paid < order.total:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot transition order to 'delivered' status because total is ₹{order.total} "
                        f"but recorded payment is only ₹{order.amount_paid}. Record full payment before delivery."
                    ),
                )
            order.delivered_at = datetime.now(timezone.utc)
            order.expected_delivery = None

        order.status = new_status

    db.commit()
    db.refresh(order)

    addr = order.address or {}
    cust_name = addr.get("name") or (order.user.name if order.user else "Customer")
    cust_phone = addr.get("phone") or (order.user.phone if order.user else None)
    cust_email = order.user.email if order.user else None

    return AdminOrderDetailResponse(
        id=order.id,
        customer=AdminOrderCustomerDetail(
            name=cust_name,
            phone=cust_phone,
            email=cust_email,
        ),
        placed_at=order.placed_at,
        expected_delivery=order.expected_delivery,
        delivered_at=order.delivered_at,
        status=order.status,
        total=order.total,
        subtotal=order.subtotal,
        amount_paid=order.amount_paid,
        payment_method=order.payment_method,
        notes=order.notes,
        source_request_id=order.source_request_id,
        address=order.address,
        items=order.items,
    )


# ---------------------------------------------------------------------------
# 3. Custom Requests Management
# ---------------------------------------------------------------------------
@router.get("/custom-requests", response_model=List[AdminCustomRequestListItem])
def get_admin_custom_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin queue for customer bulk inquiries with status filtering."""
    statement = select(CustomRequest).order_by(CustomRequest.created_at.desc())
    if status_filter and status_filter.upper() != "ALL":
        normalized_filter = status_filter.lower()
        if normalized_filter in ("new", "contacted"):
            statement = statement.where(CustomRequest.status.in_(("new", "contacted")))
        elif normalized_filter in ("cancelled", "closed"):
            statement = statement.where(CustomRequest.status.in_(("cancelled", "closed")))
        else:
            statement = statement.where(CustomRequest.status == normalized_filter)

    requests = list(db.scalars(statement).all())
    return [
        AdminCustomRequestListItem(
            id=r.id,
            customer=AdminCustomRequestCustomerSummary(name=r.name, phone=r.mobile),
            product_name=r.preferred_product,
            quantity_kg=r.quantity_kg,
            customisation=r.customization_text,
            status=r.status,
            quoted_price=r.quoted_price,
            received_at=r.created_at,
        )
        for r in requests
    ]


@router.get("/custom-requests/{id}", response_model=AdminCustomRequestDetail)
def get_admin_custom_request_by_id(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Inspects complete custom request record with customer contact and admin notes."""
    request = db.get(CustomRequest, id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom request not found",
        )
    return AdminCustomRequestDetail(
        id=request.id,
        user_id=request.user_id,
        customer=AdminCustomRequestCustomerDetail(
            name=request.name,
            phone=request.mobile,
            email=request.contact,
        ),
        product_name=request.preferred_product,
        preferred_category_id=request.preferred_category_id,
        quantity_kg=request.quantity_kg,
        customisation=request.customization_text,
        status=request.status,
        admin_notes=request.admin_notes,
        quoted_price=request.quoted_price,
        received_at=request.created_at,
        confirmed_order_id=request.confirmed_order_id,
    )


@router.patch("/custom-requests/{id}", response_model=AdminCustomRequestDetail)
def update_admin_custom_request(
    id: str,
    payload: AdminCustomRequestUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Updates workflow status, saves internal staff notes, or records agreed price."""
    request = db.get(CustomRequest, id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom request not found",
        )

    if payload.status is not None and (
        request.status in ("confirmed", "cancelled", "closed")
        or request.confirmed_order_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been decided and cannot be cancelled.",
        )

    if payload.status is not None:
        request.status = "cancelled"
    if payload.admin_notes is not None:
        request.admin_notes = payload.admin_notes
    if payload.quoted_price is not None:
        request.quoted_price = payload.quoted_price

    db.commit()
    db.refresh(request)

    return AdminCustomRequestDetail(
        id=request.id,
        user_id=request.user_id,
        customer=AdminCustomRequestCustomerDetail(
            name=request.name,
            phone=request.mobile,
            email=request.contact,
        ),
        product_name=request.preferred_product,
        preferred_category_id=request.preferred_category_id,
        quantity_kg=request.quantity_kg,
        customisation=request.customization_text,
        status=request.status,
        admin_notes=request.admin_notes,
        quoted_price=request.quoted_price,
        received_at=request.created_at,
        confirmed_order_id=request.confirmed_order_id,
    )


@router.post(
    "/custom-requests/{id}/confirm",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def confirm_custom_request(
    id: str,
    payload: CustomRequestConfirm,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Confirms custom request and automatically inserts a linked Order record."""
    request = db.get(CustomRequest, id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom request not found",
        )

    order = confirm_custom_request_order(request=request, payload=payload, db=db)
    return order


@router.get("/custom-requests/{id}/addresses", response_model=List[AddressResponse])
def get_custom_request_addresses(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Lists saved addresses for the customer attached to the custom request."""
    request = db.get(CustomRequest, id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom request not found",
        )

    statement = (
        select(Address)
        .where(Address.user_id == request.user_id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.post(
    "/custom-requests/{id}/addresses",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_custom_request_address(
    id: str,
    payload: AddressCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Creates a delivery address attached to the customer who submitted the request."""
    request = db.get(CustomRequest, id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom request not found",
        )

    existing_count = db.scalar(
        select(select(Address.id).where(Address.user_id == request.user_id).exists())
    )
    is_first = not existing_count
    make_default = payload.is_default or is_first

    if make_default:
        existing_addrs = list(
            db.scalars(select(Address).where(Address.user_id == request.user_id)).all()
        )
        for addr in existing_addrs:
            addr.is_default = False

    address = Address(
        user_id=request.user_id,
        name=payload.name,
        phone=payload.phone,
        door_no=payload.door_no,
        street=payload.street,
        landmark=payload.landmark,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        is_default=make_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


# ---------------------------------------------------------------------------
# 4. Product Catalog Management
# ---------------------------------------------------------------------------
@router.get("/products", response_model=AdminProductsResponse)
def admin_get_products(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin product catalog summary list."""
    statement = select(Product).options(selectinload(Product.variants)).order_by(Product.name.asc())
    products = list(db.scalars(statement).all())
    return AdminProductsResponse(
        products=[
            AdminProductSummary(
                id=p.id,
                name=p.name,
                slug=p.slug,
                category_id=p.category_id,
                subcategory_id=p.subcategory_id,
                image_url=p.image_url,
                badge=p.badge,
                available=p.available,
                variants=[VariantResponse.model_validate(v) for v in p.variants],
            )
            for p in products
        ]
    )


@router.get("/products/{id}", response_model=ProductDetailResponse)
def admin_get_product_by_id(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Loads complete product record for edit mode."""
    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(or_(Product.id == id, Product.slug == id))
    )
    product = db.scalar(statement)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.post(
    "/products",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_product(
    payload: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Creates a catalog product with variants and Cloudinary image URLs."""
    slug = payload.slug or slugify(payload.name)
    existing_slug = db.scalar(select(Product.id).where(Product.slug == slug))
    if existing_slug:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    product = Product(
        name=payload.name,
        slug=slug,
        description=payload.description,
        story=payload.story,
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        image_url=payload.image_url,
        gallery=payload.gallery or [],
        badge=payload.badge,
        shelf_life_months=payload.shelf_life_months,
        ingredients=payload.ingredients or [],
        available=payload.available,
        popularity=payload.popularity,
    )
    db.add(product)
    db.flush()

    for v_data in payload.variants:
        variant = ProductVariant(
            product_id=product.id,
            label=v_data.label,
            weight_g=v_data.weight_g,
            price=v_data.price,
            available=v_data.available,
            badge=v_data.badge,
        )
        db.add(variant)

    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{id}", response_model=ProductDetailResponse)
def admin_update_product(
    id: str,
    payload: ProductUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Edits descriptions, pricing, Cloudinary image URLs, variants, or availability."""
    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(or_(Product.id == id, Product.slug == id))
    )
    product = db.scalar(statement)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    updates = payload.model_dump(exclude_unset=True, exclude={"variants"})
    for field, val in updates.items():
        setattr(product, field, val)

    if payload.variants is not None:
        # Replace existing variants
        for v in product.variants:
            db.delete(v)
        db.flush()

        for v_data in payload.variants:
            new_v = ProductVariant(
                product_id=product.id,
                label=v_data.label,
                weight_g=v_data.weight_g,
                price=v_data.price,
                available=v_data.available,
                badge=v_data.badge,
            )
            db.add(new_v)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Deletes a product from the catalog. Blocked if referenced in historical orders."""
    statement = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(or_(Product.id == id, Product.slug == id))
    )
    product = db.scalar(statement)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Check whether product is referenced in historical orders
    all_orders = list(db.scalars(select(Order)).all())
    for ord_obj in all_orders:
        for it in (ord_obj.items or []):
            if it.get("product_id") == product.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cannot delete product referenced in historical orders. Mark it as unavailable instead.",
                )

    # Remove active cart items referencing this product
    cart_items = list(
        db.scalars(select(CartItem).where(CartItem.product_id == product.id)).all()
    )
    for ci in cart_items:
        db.delete(ci)

    db.delete(product)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 5. Category Taxonomy Management
# ---------------------------------------------------------------------------
@router.get("/categories", response_model=List[CategoryResponse])
def admin_get_categories(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin tree of root categories and subcategories with product metrics."""
    statement = (
        select(Category)
        .options(selectinload(Category.subcategories))
        .where(Category.parent_id.is_(None))
        .order_by(Category.display_order)
    )
    categories = list(db.scalars(statement).all())
    return [build_category_response(c, db) for c in categories]


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_category(
    payload: CategoryCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Adds a new parent category or subcategory to store taxonomy."""
    slug = payload.slug or slugify(payload.name)
    existing = db.scalar(select(Category.id).where(Category.slug == slug))
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    category = Category(
        name=payload.name,
        slug=slug,
        parent_id=payload.parent_id,
        description=payload.description,
        image_url=payload.image_url,
        display_order=payload.display_order,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return build_category_response(category, db)


# Note: /reorder MUST be defined before /{id} to prevent path collision
@router.patch("/categories/reorder")
def admin_reorder_categories(
    payload: CategoryReorder,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Persists updated display order as categories are reordered in the admin UI."""
    for idx, cat_id in enumerate(payload.ordered_ids):
        cat = db.get(Category, cat_id)
        if cat:
            cat.display_order = idx
    db.commit()
    return {"status": "ok", "message": "Categories reordered successfully"}


@router.patch("/categories/{id}", response_model=CategoryResponse)
def admin_update_category(
    id: str,
    payload: CategoryUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Edits category title, description, or slug."""
    category = db.get(Category, id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    updates = payload.model_dump(exclude_unset=True)
    for field, val in updates.items():
        setattr(category, field, val)

    db.commit()
    db.refresh(category)
    return build_category_response(category, db)


@router.delete("/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_category(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Removes a category (blocked if category contains products or subcategories)."""
    category = db.get(Category, id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Check for subcategories
    has_sub = db.scalar(
        select(select(Category.id).where(Category.parent_id == id).exists())
    )
    if has_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category containing subcategories. Delete or reassign subcategories first.",
        )

    # Check for products
    has_products = db.scalar(
        select(
            select(Product.id)
            .where(or_(Product.category_id == id, Product.subcategory_id == id))
            .exists()
        )
    )
    if has_products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category containing products. Reassign products first.",
        )

    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 6. Coupon Promotion Registry
# ---------------------------------------------------------------------------
@router.get("/coupons", response_model=List[CouponResponse])
def admin_get_coupons(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Lists all promotional coupon codes and usage metrics."""
    statement = select(Coupon).order_by(Coupon.created_at.desc())
    return list(db.scalars(statement).all())


@router.get("/coupons/{id}", response_model=CouponResponse)
def admin_get_coupon_by_id(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieves single coupon code details."""
    coupon = db.get(Coupon, id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found",
        )
    return coupon


@router.post(
    "/coupons",
    response_model=CouponResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_coupon(
    payload: CouponCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Creates a percentage or flat discount coupon code."""
    code_upper = payload.code.strip().upper()
    existing = db.scalar(select(Coupon.id).where(func.upper(Coupon.code) == code_upper))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{code_upper}' already exists.",
        )

    coupon = Coupon(
        code=code_upper,
        type=payload.type,
        value=payload.value,
        max_discount=payload.max_discount,
        min_order=payload.min_order,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        usage_limit=payload.usage_limit,
        active=payload.active,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/coupons/{id}", response_model=CouponResponse)
def admin_update_coupon(
    id: str,
    payload: CouponUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Updates coupon code schedule, thresholds, or limits."""
    coupon = db.get(Coupon, id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found",
        )

    updates = payload.model_dump(exclude_unset=True)
    if "code" in updates and updates["code"]:
        new_code = updates["code"].strip().upper()
        existing = db.scalar(
            select(Coupon.id).where(func.upper(Coupon.code) == new_code, Coupon.id != id)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{new_code}' already exists.",
            )
        updates["code"] = new_code

    for field, val in updates.items():
        setattr(coupon, field, val)

    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/coupons/{id}/toggle", response_model=CouponResponse)
def admin_toggle_coupon(
    id: str,
    payload: CouponToggle,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Quickly enables or disables a coupon without altering its settings."""
    coupon = db.get(Coupon, id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found",
        )

    coupon.active = payload.active
    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/coupons/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_coupon(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Deletes an unused coupon code (blocked if it has recorded usages)."""
    coupon = db.get(Coupon, id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found",
        )

    if coupon.used_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete coupon '{coupon.code}' because it has {coupon.used_count} recorded usages. Deactivate it instead.",
        )

    db.delete(coupon)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 7. Analytics Intelligence
# ---------------------------------------------------------------------------
@router.get("/analytics", response_model=AnalyticsResponse)
def admin_get_analytics(
    range_param: str = Query(default="30d", alias="range"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Generates KPI cards, revenue charts, order status distributions, and top product leaderboards."""
    return get_analytics_data(range_param=range_param, db=db)

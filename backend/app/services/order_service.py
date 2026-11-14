from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.address import Address
from app.models.cart import CartItem
from app.models.coupon import Coupon
from app.models.custom_request import CustomRequest
from app.models.order import Order
from app.models.user import User
from app.schemas.custom_request import CustomRequestConfirm
from app.schemas.order import OrderCreate


def create_order_from_cart(user: User, payload: OrderCreate, db: Session) -> Order:
    # 1. Retrieve cart items for authenticated customer
    statement = (
        select(CartItem)
        .options(selectinload(CartItem.product), selectinload(CartItem.variant))
        .where(CartItem.user_id == user.id)
    )
    cart_items = list(db.scalars(statement).all())

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add products before placing an order.",
        )

    # 2. Validate product and variant availability
    for item in cart_items:
        if not item.product or not item.variant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more items in your cart are no longer available in the catalog.",
            )
        if not item.product.available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{item.product.name}' is currently unavailable.",
            )
        if not item.variant.available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{item.product.name} ({item.variant.label})' is currently sold out.",
            )

    # 3. Calculate authoritative subtotal
    subtotal = sum(item.variant.price * item.quantity for item in cart_items)

    # 4. Coupon validation and calculation
    coupon_discount = 0
    applied_coupon_code: Optional[str] = None

    if payload.coupon_code and payload.coupon_code.strip():
        code_upper = payload.coupon_code.strip().upper()
        coupon_stmt = select(Coupon).where(func.upper(Coupon.code) == code_upper)
        coupon = db.scalar(coupon_stmt)

        if not coupon or not coupon.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_upper}' is invalid or inactive.",
            )

        now = datetime.now(timezone.utc)
        if coupon.starts_at and now < coupon.starts_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_upper}' is not yet active.",
            )
        if coupon.ends_at and now > coupon.ends_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_upper}' has expired.",
            )
        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_upper}' has reached its maximum usage limit.",
            )
        if subtotal < coupon.min_order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum order amount of ₹{coupon.min_order} required to use coupon '{code_upper}'.",
            )

        if coupon.type == "PERCENT":
            discount = int(subtotal * coupon.value / 100)
            if coupon.max_discount is not None:
                discount = min(discount, coupon.max_discount)
        else:  # FIXED
            discount = coupon.value

        coupon_discount = min(discount, subtotal)
        applied_coupon_code = coupon.code
        coupon.used_count += 1

    total = subtotal - coupon_discount

    # 5. Validate shipping address
    address_stmt = select(Address).where(
        Address.id == payload.address_id, Address.user_id == user.id
    )
    address = db.scalar(address_stmt)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery address not found.",
        )

    # 6. Build immutable snapshots
    items_snapshot = [
        {
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "name": item.product.name,
            "variant_label": item.variant.label,
            "price": item.variant.price,
            "qty": item.quantity,
        }
        for item in cart_items
    ]

    address_snapshot = {
        "name": address.name,
        "phone": address.phone,
        "door_no": address.door_no,
        "street": address.street,
        "landmark": address.landmark,
        "city": address.city,
        "state": address.state,
        "pincode": address.pincode,
    }

    placed_at = datetime.now(timezone.utc)
    expected_delivery = placed_at + timedelta(days=4)

    # 7. Persist order
    order = Order(
        user_id=user.id,
        status="pending",
        placed_at=placed_at,
        expected_delivery=expected_delivery,
        items=items_snapshot,
        subtotal=subtotal,
        total=total,
        coupon_code=applied_coupon_code,
        coupon_discount=coupon_discount,
        payment_method="cod",
        amount_paid=0,
        address=address_snapshot,
    )
    db.add(order)
    db.flush()

    # 8. Clear customer active cart items
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(order)
    return order


def confirm_custom_request_order(
    request: CustomRequest,
    payload: CustomRequestConfirm,
    db: Session,
) -> Order:
    # 1. Prevent duplicate confirmation
    if request.status in ("confirmed", "cancelled", "closed") or request.confirmed_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This custom request is already {request.status}.",
        )

    # 2. Verify attached delivery address
    address_stmt = select(Address).where(
        Address.id == payload.address_id, Address.user_id == request.user_id
    )
    address = db.scalar(address_stmt)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected delivery address not found for this customer.",
        )

    # 3. Build snapshots
    items_snapshot = [
        {
            "name": request.preferred_product or "Custom Sesame Oil Batch",
            "quantity_kg": request.quantity_kg,
            "price": payload.price,
            "qty": 1,
            "customization": request.customization_text,
        }
    ]

    address_snapshot = {
        "name": address.name,
        "phone": address.phone,
        "door_no": address.door_no,
        "street": address.street,
        "landmark": address.landmark,
        "city": address.city,
        "state": address.state,
        "pincode": address.pincode,
    }

    placed_at = datetime.now(timezone.utc)
    expected_delivery = placed_at + timedelta(days=5)

    # 4. Create Order atomically
    order = Order(
        user_id=request.user_id,
        status="confirmed",
        placed_at=placed_at,
        expected_delivery=expected_delivery,
        items=items_snapshot,
        subtotal=payload.price,
        total=payload.price,
        coupon_code=None,
        coupon_discount=0,
        payment_method="cod",
        amount_paid=0,
        address=address_snapshot,
        notes=payload.notes or f"Custom Request #{request.id}",
        source_request_id=request.id,
    )
    db.add(order)
    db.flush()

    # 5. Link custom request to confirmed order
    request.status = "confirmed"
    request.confirmed_order_id = order.id
    request.quoted_price = payload.price

    db.commit()
    db.refresh(order)
    db.refresh(request)
    return order

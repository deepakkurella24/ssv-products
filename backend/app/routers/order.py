from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import (
    CustomerOrderListItem,
    OrderCreate,
    OrderDetailResponse,
)
from app.services.order_service import create_order_from_cart

router = APIRouter(prefix="/order", tags=["Customer Orders"])


@router.post(
    "/",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def place_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalizes checkout, creates the order from cart items, flushes the cart, and commits."""
    order = create_order_from_cart(user=current_user, payload=payload, db=db)
    return order


@router.get("/", response_model=List[CustomerOrderListItem])
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists past orders placed by the authenticated customer for 'My Orders', sorted placed_at DESC."""
    statement = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.placed_at.desc())
    )
    orders = list(db.scalars(statement).all())

    summary_list = []
    for ord_obj in orders:
        summary_items: List[Dict[str, Any]] = []
        for it in (ord_obj.items or []):
            summary_items.append(
                {
                    "name": it.get("name", "Product"),
                    "variant_label": it.get("variant_label"),
                    "qty": it.get("qty", 1),
                }
            )

        summary_list.append(
            CustomerOrderListItem(
                id=ord_obj.id,
                placed_at=ord_obj.placed_at,
                expected_delivery=ord_obj.expected_delivery,
                delivered_at=ord_obj.delivered_at,
                status=ord_obj.status,
                total=ord_obj.total,
                items=summary_items,
            )
        )
    return summary_list


@router.get("/{id}", response_model=OrderDetailResponse)
def get_order_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Loads complete order status, live delivery details, items snapshots, and address snapshot."""
    order = db.get(Order, id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view another user's order",
        )
    return order


@router.patch("/{id}/cancel", response_model=OrderDetailResponse)
def cancel_order(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows a customer to cancel an order as long as its status is still 'pending'."""
    order = db.get(Order, id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot cancel another user's order",
        )
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already '{order.status}' and cannot be cancelled.",
        )

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order

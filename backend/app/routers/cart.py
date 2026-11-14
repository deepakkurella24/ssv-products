from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.cart import CartItem
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.cart import (
    CartItemCreate,
    CartItemPatch,
    CartItemResponse,
    CartResponse,
)

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.get("/", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves active customer cart items with current live pricing and subtotal."""
    statement = (
        select(CartItem)
        .options(selectinload(CartItem.variant))
        .where(CartItem.user_id == current_user.id)
        .order_by(CartItem.created_at.asc())
    )
    items = list(db.scalars(statement).all())

    cart_items_data = []
    subtotal = 0
    for item in items:
        price = item.variant.price if item.variant else 0
        subtotal += price * item.quantity
        cart_items_data.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                price=price,
            )
        )

    return CartResponse(cart_items=cart_items_data, subtotal=subtotal)


@router.post(
    "/items",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_cart_item(
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adds a product variant to the cart or increments existing quantity up to 10."""
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    if not product.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{product.name}' is currently unavailable",
        )

    variant = db.get(ProductVariant, payload.variant_id)
    if not variant or variant.product_id != product.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found",
        )
    if not variant.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Variant '{variant.label}' is sold out",
        )

    statement = select(CartItem).where(
        CartItem.user_id == current_user.id,
        CartItem.product_id == payload.product_id,
        CartItem.variant_id == payload.variant_id,
    )
    existing_item = db.scalar(statement)

    if existing_item:
        new_qty = min(10, existing_item.quantity + payload.quantity)
        existing_item.quantity = new_qty
        db.commit()
        db.refresh(existing_item)
        return CartItemResponse(
            id=existing_item.id,
            product_id=existing_item.product_id,
            variant_id=existing_item.variant_id,
            quantity=existing_item.quantity,
            price=variant.price,
        )

    cart_item = CartItem(
        user_id=current_user.id,
        product_id=payload.product_id,
        variant_id=payload.variant_id,
        quantity=min(10, payload.quantity),
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)

    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        variant_id=cart_item.variant_id,
        quantity=cart_item.quantity,
        price=variant.price,
    )


@router.patch("/items/{id}", response_model=CartItemResponse)
def update_cart_item(
    id: str,
    payload: CartItemPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates quantity of an existing line item in the customer's cart."""
    cart_item = db.scalar(
        select(CartItem)
        .options(selectinload(CartItem.variant))
        .where(CartItem.id == id)
    )
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    if cart_item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot modify another user's cart item",
        )

    cart_item.quantity = payload.quantity
    db.commit()
    db.refresh(cart_item)

    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        variant_id=cart_item.variant_id,
        quantity=cart_item.quantity,
        price=cart_item.variant.price if cart_item.variant else 0,
    )


@router.delete("/items/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a line item from the customer's cart."""
    cart_item = db.get(CartItem, id)
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    if cart_item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot delete another user's cart item",
        )

    db.delete(cart_item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

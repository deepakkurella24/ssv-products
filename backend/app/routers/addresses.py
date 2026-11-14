from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.address import Address
from app.models.user import User
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate

router = APIRouter(prefix="/addresses", tags=["Customer Saved Addresses"])


@router.get("/", response_model=List[AddressResponse])
def get_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists saved delivery addresses for the authenticated customer."""
    statement = (
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.post(
    "/",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_address(
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Saves a new delivery address, auto-setting default if it is the first address."""
    existing_count = db.scalar(
        select(select(Address.id).where(Address.user_id == current_user.id).exists())
    )
    is_first_address = not existing_count
    make_default = payload.is_default or is_first_address

    if make_default:
        existing_addrs = list(
            db.scalars(select(Address).where(Address.user_id == current_user.id)).all()
        )
        for addr in existing_addrs:
            addr.is_default = False

    address = Address(
        user_id=current_user.id,
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


@router.patch("/{id}", response_model=AddressResponse)
def update_address(
    id: str,
    payload: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates contact or street location details for a saved address."""
    address = db.get(Address, id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot modify another user's address",
        )

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("is_default") is True:
        existing_addrs = list(
            db.scalars(
                select(Address).where(
                    Address.user_id == current_user.id, Address.id != id
                )
            ).all()
        )
        for other in existing_addrs:
            other.is_default = False

    for field, val in updates.items():
        setattr(address, field, val)

    db.commit()
    db.refresh(address)
    return address


@router.patch("/{id}/default", response_model=AddressResponse)
def set_default_address(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sets the designated address as the primary default for future checkouts."""
    address = db.get(Address, id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot modify another user's address",
        )

    all_user_addrs = list(
        db.scalars(select(Address).where(Address.user_id == current_user.id)).all()
    )
    for addr in all_user_addrs:
        addr.is_default = (addr.id == id)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes an address from the customer's address book."""
    address = db.get(Address, id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot delete another user's address",
        )

    was_default = address.is_default
    db.delete(address)
    db.flush()

    if was_default:
        # Assign next address as default if one exists
        remaining = db.scalar(
            select(Address)
            .where(Address.user_id == current_user.id)
            .order_by(Address.created_at.desc())
        )
        if remaining:
            remaining.is_default = True

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.custom_request import CustomRequest
from app.models.user import User
from app.schemas.custom_request import (
    CustomRequestCreate,
    CustomRequestMeResponse,
    CustomRequestResponse,
)

router = APIRouter(prefix="/custom-requests", tags=["Custom Order Requests"])


@router.post(
    "/",
    response_model=CustomRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_custom_request(
    payload: CustomRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits bulk quantity, custom packaging, or unlisted product inquiry to SSV team."""
    custom_req = CustomRequest(
        user_id=current_user.id,
        name=payload.name,
        contact=payload.contact,
        mobile=payload.mobile,
        preferred_product=payload.preferred_product,
        preferred_category_id=payload.preferred_category_id,
        quantity_kg=payload.quantity_kg,
        customization_text=payload.customization_text,
        status="new",
        admin_notes=None,
        quoted_price=None,
    )
    db.add(custom_req)
    db.commit()
    db.refresh(custom_req)
    return custom_req


@router.get("/me", response_model=List[CustomRequestMeResponse])
def get_my_custom_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Displays status of custom order requests submitted by the logged-in customer."""
    statement = (
        select(CustomRequest)
        .where(CustomRequest.user_id == current_user.id)
        .order_by(CustomRequest.created_at.desc())
    )
    requests = list(db.scalars(statement).all())
    return requests

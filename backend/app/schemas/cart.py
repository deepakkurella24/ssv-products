from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemBase(BaseModel):
    product_id: str
    variant_id: str
    quantity: int = Field(default=1, ge=1, le=10)


class CartItemCreate(CartItemBase):
    pass


class CartItemPatch(BaseModel):
    quantity: int = Field(ge=1, le=10)


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: str
    quantity: int
    price: int

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    cart_items: List[CartItemResponse] = Field(default_factory=list)
    subtotal: int = 0

    model_config = ConfigDict(from_attributes=True)

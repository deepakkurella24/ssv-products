from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class OrderCreate(BaseModel):
    address_id: str
    payment_method: str = "cod"
    cart_id: Optional[str] = None
    coupon_code: Optional[str] = None

    @model_validator(mode="after")
    def validate_payment_method(self):
        if self.payment_method.lower() != "cod":
            raise ValueError("Only Cash on Delivery ('cod') is supported.")
        self.payment_method = "cod"
        return self


class OrderItemSnapshot(BaseModel):
    product_id: Optional[str] = None
    variant_id: Optional[str] = None
    name: str
    variant_label: Optional[str] = None
    price: int
    qty: int


class CustomerOrderListItem(BaseModel):
    id: str
    placed_at: datetime
    expected_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    status: str
    total: int
    items: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(BaseModel):
    id: str
    user_id: str
    status: str
    placed_at: datetime
    expected_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    items: List[Dict[str, Any]] = Field(default_factory=list)
    subtotal: int
    total: int
    coupon_code: Optional[str] = None
    coupon_discount: int = 0
    payment_method: str = "cod"
    amount_paid: int = 0
    address: Dict[str, Any]
    notes: Optional[str] = None
    source_request_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminOrderCustomerSummary(BaseModel):
    name: str


class AdminOrderCustomerDetail(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class AdminOrderItemSummary(BaseModel):
    qty: int


class AdminOrderListItem(BaseModel):
    id: str
    customer: AdminOrderCustomerSummary
    placed_at: datetime
    expected_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    status: str
    total: int
    amount_paid: int
    payment_method: str = "cod"
    items: List[AdminOrderItemSummary] = Field(default_factory=list)
    source_request_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminOrderDetailResponse(BaseModel):
    id: str
    customer: AdminOrderCustomerDetail
    placed_at: datetime
    expected_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    status: str
    total: int
    subtotal: int
    amount_paid: int
    payment_method: str = "cod"
    notes: Optional[str] = None
    source_request_id: Optional[str] = None
    address: Dict[str, Any]
    items: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminOrderUpdate(BaseModel):
    status: Optional[str] = None
    amount_paid: Optional[int] = Field(default=None, ge=0)
    expected_delivery: Optional[datetime] = None


class AdminCountsResponse(BaseModel):
    pendingOrders: int
    newRequests: int

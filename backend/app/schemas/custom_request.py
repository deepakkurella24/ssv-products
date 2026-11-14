from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator


def normalize_custom_request_status(value: str) -> str:
    """Expose the simplified lifecycle for records created under the old workflow."""
    return {"contacted": "new", "closed": "cancelled"}.get(value, value)


class CustomRequestCreate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    contact: Optional[str] = Field(default=None, max_length=100)
    mobile: str = Field(min_length=10, max_length=20)
    preferred_product: Optional[str] = Field(default=None, max_length=200)
    preferred_category_id: Optional[str] = None
    quantity_kg: Any = Field(default="1")
    customization_text: Optional[str] = Field(default=None)
    item: Optional[str] = None
    details: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # item alias for preferred_product
            if not data.get("preferred_product") and data.get("item"):
                data["preferred_product"] = data.get("item")
            if not data.get("item") and data.get("preferred_product"):
                data["item"] = data.get("preferred_product")

            # details alias for customization_text
            if not data.get("customization_text") and data.get("details"):
                data["customization_text"] = data.get("details")
            elif not data.get("customization_text"):
                data["customization_text"] = data.get("preferred_product") or data.get("item") or "Custom inquiry"
            if not data.get("details"):
                data["details"] = data.get("customization_text")

            # fallback name and contact
            if not data.get("name"):
                data["name"] = "Customer"
            if not data.get("contact"):
                data["contact"] = data.get("mobile", "")

            # normalize quantity_kg to string
            if "quantity_kg" in data:
                data["quantity_kg"] = str(data["quantity_kg"])
        return data


class CustomRequestResponse(BaseModel):
    id: str
    user_id: str
    name: str
    contact: str
    mobile: str
    preferred_product: Optional[str] = None
    preferred_category_id: Optional[str] = None
    quantity_kg: str
    customization_text: str
    status: str
    admin_notes: Optional[str] = None
    quoted_price: Optional[int] = None
    created_at: datetime

    @computed_field
    @property
    def item(self) -> Optional[str]:
        return self.preferred_product

    @computed_field
    @property
    def details(self) -> Optional[str]:
        return self.customization_text

    model_config = ConfigDict(from_attributes=True)


class CustomRequestMeResponse(BaseModel):
    id: str
    preferred_product: Optional[str] = None
    quantity_kg: str
    customization_text: str
    mobile: str
    status: str
    quoted_price: Optional[int] = None
    created_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return normalize_custom_request_status(value)

    @computed_field
    @property
    def item(self) -> Optional[str]:
        return self.preferred_product

    @computed_field
    @property
    def details(self) -> Optional[str]:
        return self.customization_text

    model_config = ConfigDict(from_attributes=True)


class AdminCustomRequestCustomerSummary(BaseModel):
    name: str
    phone: str


class AdminCustomRequestCustomerDetail(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None


class AdminCustomRequestListItem(BaseModel):
    id: str
    customer: AdminCustomRequestCustomerSummary
    product_name: Optional[str] = None
    quantity_kg: str
    customisation: str
    status: str
    quoted_price: Optional[int] = None
    received_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return normalize_custom_request_status(value)

    model_config = ConfigDict(from_attributes=True)


class AdminCustomRequestDetail(BaseModel):
    id: str
    user_id: str
    customer: AdminCustomRequestCustomerDetail
    product_name: Optional[str] = None
    preferred_category_id: Optional[str] = None
    quantity_kg: str
    customisation: str
    status: str
    admin_notes: Optional[str] = None
    quoted_price: Optional[int] = None
    received_at: datetime
    confirmed_order_id: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return normalize_custom_request_status(value)

    model_config = ConfigDict(from_attributes=True)


class AdminCustomRequestUpdate(BaseModel):
    status: Optional[Literal["cancelled"]] = None
    admin_notes: Optional[str] = None
    quoted_price: Optional[int] = Field(default=None, ge=0)


class CustomRequestConfirm(BaseModel):
    price: int = Field(gt=0)
    address_id: str
    notes: Optional[str] = None

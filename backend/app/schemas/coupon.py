from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CouponBase(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    type: str = "PERCENT"  # "PERCENT" or "FIXED"
    value: int = Field(gt=0)
    max_discount: Optional[int] = Field(default=None, ge=0)
    min_order: int = Field(default=0, ge=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    usage_limit: Optional[int] = Field(default=None, ge=1)
    active: bool = True

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("PERCENT", "FIXED"):
            raise ValueError("type must be either 'PERCENT' or 'FIXED'")
        return v


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[str] = None
    value: Optional[int] = Field(default=None, gt=0)
    max_discount: Optional[int] = Field(default=None, ge=0)
    min_order: Optional[int] = Field(default=None, ge=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    usage_limit: Optional[int] = Field(default=None, ge=1)
    active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().upper()
            if v not in ("PERCENT", "FIXED"):
                raise ValueError("type must be either 'PERCENT' or 'FIXED'")
        return v


class CouponToggle(BaseModel):
    active: bool


class CouponResponse(CouponBase):
    id: str
    used_count: int = 0

    model_config = ConfigDict(from_attributes=True)

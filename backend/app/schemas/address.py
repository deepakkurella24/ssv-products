from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AddressBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    door_no: str = Field(min_length=1, max_length=50)
    street: str = Field(min_length=2, max_length=200)
    landmark: Optional[str] = Field(default=None, max_length=150)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(min_length=6, max_length=20)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=10, max_length=20)
    door_no: Optional[str] = Field(default=None, min_length=1, max_length=50)
    street: Optional[str] = Field(default=None, min_length=2, max_length=200)
    landmark: Optional[str] = Field(default=None, max_length=150)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    state: Optional[str] = Field(default=None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(default=None, min_length=6, max_length=20)
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: str
    user_id: str

    model_config = ConfigDict(from_attributes=True)

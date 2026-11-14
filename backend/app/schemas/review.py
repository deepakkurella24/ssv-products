from datetime import datetime
from typing import Optional
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field
from pydantic import field_validator


class ReviewCreate(BaseModel):
    order_id: Optional[str] = None
    user_name: str = Field(min_length=2, max_length=100)
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=150)
    comment: str = Field(min_length=3)
    variant_label: Optional[str] = Field(default=None, max_length=50)
    images: list[str] = Field(default_factory=list, max_length=2)

    @field_validator("images")
    @classmethod
    def images_must_be_https(cls, images: list[str]) -> list[str]:
        for image in images:
            parsed = urlsplit(image)
            if parsed.scheme != "https" or not parsed.netloc:
                raise ValueError("Review images must be HTTPS URLs")
        return images


class ReviewResponse(BaseModel):
    id: str
    product_id: str
    order_id: Optional[str] = None
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: str
    created_at: datetime
    verified_buyer: bool = Field(default=True)
    variant_label: Optional[str] = None
    images: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

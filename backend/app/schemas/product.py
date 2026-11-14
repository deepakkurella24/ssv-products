from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class VariantBase(BaseModel):
    label: str = Field(min_length=1, max_length=50)
    weight_g: int = Field(default=0, ge=0)
    price: int = Field(gt=0)
    available: bool = True
    badge: Optional[str] = None


class VariantCreate(VariantBase):
    id: Optional[str] = None


class VariantResponse(VariantBase):
    id: str
    product_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: Optional[str] = None
    description: str = Field(min_length=3)
    story: Optional[str] = None
    category_id: str
    subcategory_id: Optional[str] = None
    image_url: str
    gallery: List[str] = Field(default_factory=list, max_length=3)
    badge: Optional[str] = None
    shelf_life_months: int = Field(default=12, ge=1)
    ingredients: List[str] = Field(default_factory=list)
    available: bool = True
    popularity: int = Field(default=0, ge=0)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an HTTP/HTTPS URL")
        return v

    @field_validator("gallery")
    @classmethod
    def validate_gallery(cls, v: List[str]) -> List[str]:
        if len(v) > 3:
            raise ValueError("Gallery can have at most 3 images")
        for url in v:
            if not (url.startswith("http://") or url.startswith("https://")):
                raise ValueError(f"Gallery URL '{url}' must be an HTTP/HTTPS URL")
        return v


class ProductCreate(ProductBase):
    variants: List[VariantCreate] = Field(min_length=1)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    slug: Optional[str] = None
    description: Optional[str] = None
    story: Optional[str] = None
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    image_url: Optional[str] = None
    gallery: Optional[List[str]] = Field(default=None, max_length=3)
    badge: Optional[str] = None
    shelf_life_months: Optional[int] = Field(default=None, ge=1)
    ingredients: Optional[List[str]] = None
    available: Optional[bool] = None
    popularity: Optional[int] = Field(default=None, ge=0)
    variants: Optional[List[VariantCreate]] = None

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("image_url must be an HTTP/HTTPS URL")
        return v

    @field_validator("gallery")
    @classmethod
    def validate_gallery(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            if len(v) > 3:
                raise ValueError("Gallery can have at most 3 images")
            for url in v:
                if not (url.startswith("http://") or url.startswith("https://")):
                    raise ValueError(f"Gallery URL '{url}' must be an HTTP/HTTPS URL")
        return v


class ProductListItem(BaseModel):
    id: str
    name: str
    slug: str
    category_id: str
    subcategory_id: Optional[str] = None
    badge: Optional[str] = None
    available: bool
    image_url: str
    shelf_life_months: int
    variants: List[VariantResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    category_id: str
    subcategory_id: Optional[str] = None
    badge: Optional[str] = None
    available: bool
    image_url: str
    gallery: List[str] = Field(default_factory=list)
    shelf_life_months: int
    description: str
    story: Optional[str] = None
    ingredients: List[str] = Field(default_factory=list)
    popularity: int
    variants: List[VariantResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProductsResponse(BaseModel):
    products: List[ProductListItem]
    total: int

    model_config = ConfigDict(from_attributes=True)


class AdminProductSummary(BaseModel):
    id: str
    name: str
    slug: str
    category_id: str
    subcategory_id: Optional[str] = None
    image_url: str
    badge: Optional[str] = None
    available: bool
    variants: List[VariantResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminProductsResponse(BaseModel):
    products: List[AdminProductSummary]

    model_config = ConfigDict(from_attributes=True)

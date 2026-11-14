from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubcategoryItem(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    display_order: Optional[int] = 0
    product_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None


class CategoryReorder(BaseModel):
    parent_id: Optional[str] = None
    ordered_ids: List[str]


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[str] = None
    display_order: int = 0
    product_count: Optional[int] = 0
    subcategories: List[SubcategoryItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

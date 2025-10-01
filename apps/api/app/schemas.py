from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class Pagination(BaseModel):
    limit: int = Field(ge=1, le=100, default=10)
    offset: int = Field(ge=0, default=0)


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupplierBase(BaseModel):
    name: str
    website: Optional[str] = None
    contact_email: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None


class SupplierRead(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OfferBase(BaseModel):
    product_id: int
    supplier_id: int
    price: Decimal
    currency: str = Field(min_length=3, max_length=3)
    url: str
    available: bool = True


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    price: Optional[Decimal] = None
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    url: Optional[str] = None
    available: Optional[bool] = None


class OfferRead(OfferBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScrapeJobCreate(BaseModel):
    product_id: Optional[int] = None
    supplier_id: Optional[int] = None
    offer_id: Optional[int] = None


class ScrapeJobRead(BaseModel):
    id: int
    product_id: Optional[int]
    supplier_id: Optional[int]
    offer_id: Optional[int]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    status: str
    log: Optional[str]

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    total: int
    items: list


class PaginatedProducts(PaginatedResponse):
    items: list[ProductRead]


class PaginatedSuppliers(PaginatedResponse):
    items: list[SupplierRead]


class PaginatedOffers(PaginatedResponse):
    items: list[OfferRead]

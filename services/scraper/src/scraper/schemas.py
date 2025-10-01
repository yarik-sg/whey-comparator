from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class OfferSchema(BaseModel):
    id: int
    source: str
    url: str
    price: float
    currency: str
    price_per_100g_protein: float | None
    stock_status: str | None
    last_checked: datetime | None

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    id: int
    name: str
    brand: str | None
    flavour: str | None
    protein_per_serving_g: float | None
    serving_size_g: float | None

    class Config:
        from_attributes = True


class ProductWithOffersSchema(ProductSchema):
    offers: list[OfferSchema]

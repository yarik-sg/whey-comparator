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
    in_stock: bool | None
    shipping_cost: float | None
    shipping_text: str | None
    last_checked: datetime | None
    image: str | None = None

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    id: int
    name: str
    brand: str | None
    flavour: str | None
    protein_per_serving_g: float | None
    serving_size_g: float | None
    image: str | None = None
    image_url: str | None = None

    class Config:
        from_attributes = True


class ProductWithOffersSchema(ProductSchema):
    offers: list[OfferSchema]


class PriceHistoryEntrySchema(BaseModel):
    date: datetime
    price: float
    currency: str
    platform: str | None = None
    in_stock: bool | None = None

    class Config:
        from_attributes = True


class PriceHistoryStatisticsSchema(BaseModel):
    current_price: float
    lowest_price: float
    highest_price: float
    average_price: float
    price_change_percent: float
    trend: str
    data_points: int
    is_historical_low: bool


class PriceHistoryResponseSchema(BaseModel):
    product_id: int
    period: str
    history: list[PriceHistoryEntrySchema]
    statistics: PriceHistoryStatisticsSchema | None

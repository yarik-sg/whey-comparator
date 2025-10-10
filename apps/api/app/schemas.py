from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class MoneyAmount(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = "EUR"
    formatted: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda value: float(value) if value is not None else None},
    )


class Pagination(BaseModel):
    limit: int = Field(ge=1, le=100, default=10)
    offset: int = Field(ge=0, default=0)


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=0)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    rating: Optional[Decimal] = Field(default=None, ge=0, le=5)
    reviews_count: Optional[int] = Field(default=None, ge=0)
    protein_per_serving_g: Optional[Decimal] = Field(default=None, ge=0)
    serving_size_g: Optional[Decimal] = Field(default=None, ge=0)
    in_stock: Optional[bool] = None
    stock_status: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    rating: Optional[Decimal] = Field(default=None, ge=0, le=5)
    reviews_count: Optional[int] = Field(default=None, ge=0)
    protein_per_serving_g: Optional[Decimal] = Field(default=None, ge=0)
    serving_size_g: Optional[Decimal] = Field(default=None, ge=0)
    in_stock: Optional[bool] = None
    stock_status: Optional[str] = None


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    flavour: Optional[str] = None
    image_url: Optional[str] = Field(default=None, alias="image_url")
    image: Optional[str] = None
    gallery: Optional[list[str]] = Field(default=None, alias="gallery")
    best_price: MoneyAmount = Field(alias="bestPrice")
    total_price: Optional[MoneyAmount] = Field(default=None, alias="totalPrice")
    best_deal: Optional[dict] = Field(default=None, alias="bestDeal")
    offers_count: int = Field(alias="offersCount")
    in_stock: Optional[bool] = Field(default=None, alias="inStock")
    stock_status: Optional[str] = Field(default=None, alias="stockStatus")
    rating: Optional[Decimal] = None
    reviews_count: Optional[int] = Field(default=None, alias="reviewsCount")
    protein_per_serving_g: Optional[Decimal] = Field(
        default=None, alias="proteinPerServingG"
    )
    serving_size_g: Optional[Decimal] = Field(default=None, alias="servingSizeG")
    protein_per_euro: Optional[Decimal] = Field(default=None, alias="proteinPerEuro")
    price_per_kg: Optional[Decimal] = Field(default=None, alias="pricePerKg")
    best_vendor: Optional[str] = Field(default=None, alias="bestVendor")


class PaginationInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page: int
    per_page: int = Field(serialization_alias="perPage")
    total: int
    total_pages: int = Field(serialization_alias="totalPages")
    has_previous: bool = Field(serialization_alias="hasPrevious")
    has_next: bool = Field(serialization_alias="hasNext")


class ProductListResponse(BaseModel):
    products: list[ProductSummary]
    pagination: PaginationInfo


class DealItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    vendor: str
    price: MoneyAmount
    total_price: Optional[MoneyAmount] = Field(default=None, alias="totalPrice")
    shipping_cost: Optional[Decimal] = Field(default=None, alias="shippingCost")
    shipping_text: Optional[str] = Field(default=None, alias="shippingText")
    in_stock: Optional[bool] = Field(default=None, alias="inStock")
    stock_status: Optional[str] = Field(default=None, alias="stockStatus")
    link: Optional[str] = None
    image: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = Field(default=None, alias="reviewsCount")
    best_price: bool = Field(alias="bestPrice")
    is_best_price: Optional[bool] = Field(default=None, alias="isBestPrice")
    source: str
    product_id: Optional[int] = Field(default=None, alias="productId")
    expires_at: Optional[datetime] = Field(default=None, alias="expiresAt")
    weight_kg: Optional[float] = Field(default=None, alias="weightKg")
    price_per_kg: Optional[float] = Field(default=None, alias="pricePerKg")


class ScraperOffer(BaseModel):
    id: int
    source: str
    url: str
    price: Decimal
    currency: str
    price_per_100g_protein: Optional[Decimal] = None
    stock_status: Optional[str] = None
    in_stock: Optional[bool] = None
    shipping_cost: Optional[Decimal] = None
    shipping_text: Optional[str] = None
    last_checked: Optional[datetime] = None


class ProductOfferSources(BaseModel):
    scraper: list[ScraperOffer] = Field(default_factory=list)


class ProductOffersResponse(BaseModel):
    product: ProductSummary
    offers: list[DealItem]
    sources: ProductOfferSources


class PriceHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: datetime
    price: float
    currency: str
    platform: Optional[str] = None
    in_stock: Optional[bool] = None


class PriceHistoryStatistics(BaseModel):
    current_price: float
    lowest_price: float
    highest_price: float
    average_price: float
    price_change_percent: float
    trend: str
    data_points: int
    is_historical_low: bool


class PriceHistoryResponse(BaseModel):
    product_id: int
    period: str
    history: list[PriceHistoryEntry]
    statistics: Optional[PriceHistoryStatistics] = None


class ReviewBreakdown(BaseModel):
    stars: int
    count: int
    percentage: float


class ReviewHighlight(BaseModel):
    id: str
    title: str
    rating: float
    summary: str
    source: str
    url: Optional[str] = None


class ProductReviewsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    average_rating: Optional[float] = Field(default=None, alias="averageRating")
    reviews_count: int = Field(alias="reviewsCount")
    sources: int
    distribution: list[ReviewBreakdown]
    highlights: list[ReviewHighlight]


class SimilarProductsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    similar: list[ProductSummary]


class PriceAlertBase(BaseModel):
    user_email: str
    product_id: int
    target_price: Decimal = Field(ge=0)
    platform: Optional[str] = None


class PriceAlertCreate(PriceAlertBase):
    pass


class PriceAlertRead(PriceAlertBase):
    id: int
    active: bool
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductSummary] = None

    model_config = ConfigDict(from_attributes=True)


class PriceAlertUpdate(BaseModel):
    active: Optional[bool] = None


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

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel):
    total: int
    items: list


class PaginatedProducts(PaginatedResponse):
    items: list[ProductRead]


class PaginatedSuppliers(PaginatedResponse):
    items: list[SupplierRead]


class PaginatedOffers(PaginatedResponse):
    items: list[OfferRead]

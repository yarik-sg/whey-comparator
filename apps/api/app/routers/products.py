from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Annotated, Iterable

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas
from ..database import get_db
from ..models import Offer, PriceHistory, Product

router = APIRouter()


PRICE_HISTORY_PERIODS: dict[str, timedelta | None] = {
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
    "1y": timedelta(days=365),
    "all": None,
}


def _format_currency(amount: Decimal | None, currency: str | None) -> str | None:
    if amount is None:
        return None
    currency_code = currency or "EUR"
    return f"{float(amount):.2f} {currency_code}"


def _money(amount: Decimal | None, currency: str | None) -> schemas.MoneyAmount:
    currency_code = currency or "EUR"
    formatted = _format_currency(amount, currency_code)
    return schemas.MoneyAmount(amount=amount, currency=currency_code, formatted=formatted)


def _safe_ratio(numerator: Decimal | None, denominator: Decimal | None) -> Decimal | None:
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return numerator / denominator


def _price_per_kg(price: Decimal | None, serving_size_g: Decimal | None) -> Decimal | None:
    if price is None or serving_size_g is None:
        return None
    if serving_size_g == 0:
        return None
    kilograms = serving_size_g / Decimal(1000)
    if kilograms == 0:
        return None
    return price / kilograms


def _best_offer(offers: Iterable[Offer]) -> Offer | None:
    offers_list = list(offers)
    if not offers_list:
        return None
    return min(offers_list, key=lambda offer: float(offer.price))


def _build_deal_item(
    product: Product, offer: Offer, best_offer_id: int | None
) -> schemas.DealItem:
    supplier_name = offer.supplier.name if offer.supplier else "Catalogue interne"
    rating = float(product.rating) if product.rating is not None else None
    reviews_count = int(product.reviews_count) if product.reviews_count is not None else None
    stock_status = product.stock_status
    if not stock_status:
        stock_status = "En stock" if offer.available else "Rupture de stock"

    price = _money(offer.price, offer.currency)
    price_per_kg = _price_per_kg(offer.price, product.serving_size_g)

    return schemas.DealItem(
        id=str(offer.id),
        title=product.name,
        vendor=supplier_name,
        price=price,
        total_price=price,
        in_stock=offer.available,
        stock_status=stock_status,
        link=offer.url,
        image=product.image_url,
        rating=rating,
        reviews_count=reviews_count,
        best_price=offer.id == best_offer_id,
        is_best_price=offer.id == best_offer_id,
        source=supplier_name,
        product_id=product.id,
        price_per_kg=float(price_per_kg) if price_per_kg is not None else None,
    )


def _build_product_summary(product: Product) -> schemas.ProductSummary:
    offers = product.offers or []
    best_offer = _best_offer(offers)

    best_price_amount = product.price if product.price is not None else (
        best_offer.price if best_offer else None
    )
    best_currency = product.currency or (best_offer.currency if best_offer else "EUR")

    protein_per_euro = _safe_ratio(product.protein_per_serving_g, best_price_amount)
    price_per_kg = _price_per_kg(best_price_amount, product.serving_size_g)

    rating = float(product.rating) if product.rating is not None else None
    protein_per_serving = (
        float(product.protein_per_serving_g)
        if product.protein_per_serving_g is not None
        else None
    )
    serving_size = (
        float(product.serving_size_g) if product.serving_size_g is not None else None
    )
    protein_per_euro_value = float(protein_per_euro) if protein_per_euro is not None else None
    price_per_kg_value = float(price_per_kg) if price_per_kg is not None else None

    gallery = [value for value in {product.image_url} if value]

    return schemas.ProductSummary(
        id=product.id,
        name=product.name,
        brand=product.brand,
        category=product.category,
        flavour=None,
        image_url=product.image_url,
        image=product.image_url,
        gallery=gallery or None,
        bestPrice=_money(best_price_amount, best_currency),
        totalPrice=None,
        bestDeal=None,
        offersCount=len(offers),
        inStock=product.in_stock if product.in_stock is not None else (best_offer.available if best_offer else None),
        stockStatus=product.stock_status,
        rating=rating,
        reviewsCount=product.reviews_count,
        proteinPerServingG=protein_per_serving,
        servingSizeG=serving_size,
        proteinPerEuro=protein_per_euro_value,
        pricePerKg=price_per_kg_value,
        bestVendor=best_offer.supplier.name if best_offer and best_offer.supplier else None,
    )


@router.get("/", response_model=schemas.ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    brands: str | None = None,
    min_rating: float | None = Query(default=None, ge=0, le=5),
    in_stock_only: bool = False,
    sort_by: str = Query(
        "price_asc",
        pattern="^(price_asc|price_desc|rating|protein_ratio)$",
    ),
    db: Annotated[Session, Depends(get_db)] = None,
):
    base_query = select(Product).options(
        selectinload(Product.offers).selectinload(Offer.supplier)
    )
    filters = []
    if search:
        filters.append(Product.name.ilike(f"%{search}%"))
    if category:
        filters.append(Product.category == category)
    if min_price is not None:
        filters.append(Product.price >= Decimal(str(min_price)))
    if max_price is not None:
        filters.append(Product.price <= Decimal(str(max_price)))
    if brands:
        brand_values = [value.strip() for value in brands.split(",") if value.strip()]
        if brand_values:
            filters.append(Product.brand.in_(brand_values))
    if min_rating is not None:
        filters.append(Product.rating >= Decimal(str(min_rating)))
    if in_stock_only:
        filters.append(Product.in_stock.is_(True))

    if filters:
        base_query = base_query.where(*filters)

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    if sort_by == "price_asc":
        ordered_query = base_query.order_by(asc(Product.price).nullslast())
    elif sort_by == "price_desc":
        ordered_query = base_query.order_by(desc(Product.price).nullsfirst())
    elif sort_by == "rating":
        ordered_query = base_query.order_by(desc(Product.rating).nullslast())
    else:  # protein_ratio
        ratio = Product.protein_per_serving_g / func.nullif(Product.price, 0)
        ordered_query = base_query.order_by(desc(ratio))

    offset = (page - 1) * per_page
    items = (
        db.execute(ordered_query.offset(offset).limit(per_page))
        .scalars()
        .all()
    )

    total_pages = math.ceil(total / per_page) if per_page else 0

    return schemas.ProductListResponse(
        products=[_build_product_summary(item) for item in items],
        pagination=schemas.PaginationInfo(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
            has_previous=page > 1,
            has_next=page < total_pages,
        ),
    )


@router.post("/", response_model=schemas.ProductRead, status_code=201)
def create_product(
    payload: schemas.ProductCreate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)] = None):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}/offers", response_model=schemas.ProductOffersResponse)
def get_product_offers(
    product_id: int, db: Annotated[Session, Depends(get_db)] = None
):
    product = (
        db.execute(
            select(Product)
            .options(selectinload(Product.offers).selectinload(Offer.supplier))
            .where(Product.id == product_id)
        )
        .scalars()
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    offers = product.offers or []
    best_offer = _best_offer(offers)
    best_offer_id = best_offer.id if best_offer else None

    deal_items = [_build_deal_item(product, offer, best_offer_id) for offer in offers]

    return schemas.ProductOffersResponse(
        product=_build_product_summary(product),
        offers=deal_items,
        sources=schemas.ProductOfferSources(scraper=[]),
    )


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Annotated[Session, Depends(get_db)] = None):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None


@router.get("/{product_id}/price-history", response_model=schemas.PriceHistoryResponse)
def get_price_history(
    product_id: int,
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history_query = (
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.recorded_at.asc())
    )
    delta = PRICE_HISTORY_PERIODS.get(period)
    if delta:
        start_date = datetime.now(timezone.utc) - delta
        history_query = history_query.where(PriceHistory.recorded_at >= start_date)

    entries = db.execute(history_query).scalars().all()

    points = [
        schemas.PriceHistoryPoint(
            recorded_at=entry.recorded_at,
            price=_money(entry.price, entry.currency),
            platform=entry.platform,
        )
        for entry in entries
    ]

    prices = [entry.price for entry in entries if entry.price is not None]
    current_price = entries[-1].price if entries else product.price
    currency = entries[-1].currency if entries else product.currency

    if prices:
        lowest = min(prices)
        highest = max(prices)
        average = sum(prices) / len(prices)
    else:
        lowest = highest = average = None

    statistics = schemas.PriceHistoryStatistics(
        lowest=_money(lowest, currency),
        highest=_money(highest, currency),
        average=_money(average, currency),
        current=_money(current_price, currency),
    )

    return schemas.PriceHistoryResponse(
        product_id=product.id,
        period=period,
        points=points,
        statistics=statistics,
    )


def _score_similar_product(base: Product, candidate: Product) -> float:
    score = 0.0

    if base.brand and candidate.brand and base.brand.lower() == candidate.brand.lower():
        score += 3

    if base.category and candidate.category and base.category == candidate.category:
        score += 2

    if candidate.rating is not None:
        score += float(candidate.rating)

    if base.price is not None and candidate.price is not None:
        difference = abs(float(base.price) - float(candidate.price))
        score += max(0.0, 1.0 - min(difference / 50.0, 1.0))

    return score


def _estimate_distribution(average: float | None, total_reviews: int) -> list[schemas.ReviewBreakdown]:
    buckets: list[schemas.ReviewBreakdown] = []

    if total_reviews <= 0 or average is None:
        for stars in range(5, 0, -1):
            buckets.append(
                schemas.ReviewBreakdown(stars=stars, count=0, percentage=0.0)
            )
        return buckets

    weights: list[float] = []
    for stars in range(5, 0, -1):
        distance = abs(average - stars)
        weight = max(0.1, 1 - distance / 4)
        weights.append(weight)

    total_weight = sum(weights)
    if total_weight == 0:
        total_weight = 1

    raw_counts = [weight / total_weight * total_reviews for weight in weights]
    counts = [int(value) for value in raw_counts]
    remainder = total_reviews - sum(counts)

    if remainder > 0:
        fractional = [value - int(value) for value in raw_counts]
        while remainder > 0:
            index = max(range(len(fractional)), key=fractional.__getitem__)
            counts[index] += 1
            fractional[index] = 0
            remainder -= 1

    for index, stars in enumerate(range(5, 0, -1)):
        count = counts[index]
        percentage = (count / total_reviews) * 100 if total_reviews else 0
        buckets.append(
            schemas.ReviewBreakdown(
                stars=stars,
                count=count,
                percentage=round(percentage, 2),
            )
        )

    return buckets


@router.get("/{product_id}/similar", response_model=schemas.SimilarProductsResponse)
def get_similar_products(
    product_id: int,
    limit: int = Query(4, ge=1, le=12),
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = (
        db.execute(
            select(Product)
            .options(selectinload(Product.offers).selectinload(Offer.supplier))
            .where(Product.id == product_id)
        )
        .scalars()
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    candidates = (
        db.execute(
            select(Product)
            .options(selectinload(Product.offers).selectinload(Offer.supplier))
            .where(Product.id != product_id)
        )
        .scalars()
        .all()
    )

    scored = sorted(
        candidates,
        key=lambda candidate: (
            _score_similar_product(product, candidate),
            candidate.updated_at or datetime.min,
        ),
        reverse=True,
    )

    selected = [_build_product_summary(item) for item in scored[:limit]]

    return schemas.SimilarProductsResponse(productId=product.id, similar=selected)


@router.get("/{product_id}/reviews", response_model=schemas.ProductReviewsResponse)
def get_product_reviews(
    product_id: int,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    average_rating = float(product.rating) if product.rating is not None else None
    reviews_count = int(product.reviews_count or 0)
    distribution = _estimate_distribution(average_rating, reviews_count)

    highlights: list[schemas.ReviewHighlight] = []
    if average_rating is not None:
        highlights.append(
            schemas.ReviewHighlight(
                id="strengths",
                title="Les clients adorent",
                rating=round(average_rating, 1),
                summary=(
                    "Goût, miscibilité et digestion sont les points les plus cités dans les avis positifs."
                ),
                source="Synthèse SerpAPI",
            )
        )
        highlights.append(
            schemas.ReviewHighlight(
                id="watchpoints",
                title="À surveiller",
                rating=max(0.0, round(min(average_rating - 0.7, 5), 1)),
                summary=(
                    "Quelques utilisateurs mentionnent des variations de texture selon les lots et des délais de livraison variables."
                ),
                source="Synthèse SerpAPI",
            )
        )

    return schemas.ProductReviewsResponse(
        productId=product.id,
        averageRating=average_rating,
        reviewsCount=reviews_count,
        sources=1 if reviews_count else 0,
        distribution=distribution,
        highlights=highlights,
    )

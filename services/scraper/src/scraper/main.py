from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .cache import cache
from .database import PriceHistory, Product, get_session, init_models
from .scheduler import scheduler
from .schemas import (
    PriceHistoryEntrySchema,
    PriceHistoryResponseSchema,
    ProductSchema,
    ProductWithOffersSchema,
    PriceHistoryStatisticsSchema,
)
from .settings import settings

app = FastAPI(title="Whey Comparator Scraper", version="0.1.0")


async def get_db_session() -> AsyncSession:
    async with get_session() as session:
        yield session


@app.on_event("startup")
async def startup_event() -> None:
    await init_models()
    scheduler.start()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await cache.close()
    await scheduler.shutdown()


@app.get("/products", response_model=list[ProductSchema])
async def list_products(session: AsyncSession = Depends(get_db_session)) -> list[ProductSchema]:
    cache_key = "products:list"
    cached = await cache.get_json(cache_key)
    if cached:
        return [ProductSchema.model_validate(item) for item in cached]

    products = (await session.scalars(select(Product))).all()
    result = [ProductSchema.model_validate(prod) for prod in products]
    await cache.set_json(cache_key, [item.model_dump() for item in result])
    return result


@app.get("/products/{product_id}/offers", response_model=ProductWithOffersSchema)
async def product_offers(
    product_id: int, session: AsyncSession = Depends(get_db_session)
) -> ProductWithOffersSchema:
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    await session.refresh(product, attribute_names=["offers"])
    return ProductWithOffersSchema.model_validate(product)


@app.get(
    "/products/{product_id}/price-history",
    response_model=PriceHistoryResponseSchema,
)
async def product_price_history(
    product_id: int,
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    platform: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db_session),
) -> PriceHistoryResponseSchema:
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    period_mapping: dict[str, timedelta | None] = {
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90),
        "1y": timedelta(days=365),
        "all": None,
    }

    stmt = select(PriceHistory).where(PriceHistory.product_id == product_id)
    delta = period_mapping.get(period)
    if delta is not None:
        start_date = datetime.now(timezone.utc) - delta
        stmt = stmt.where(PriceHistory.recorded_at >= start_date)

    if platform:
        stmt = stmt.where(PriceHistory.platform == platform)

    stmt = stmt.order_by(PriceHistory.recorded_at.asc())
    history_rows = (await session.scalars(stmt)).all()

    if not history_rows:
        return PriceHistoryResponseSchema(
            product_id=product_id,
            period=period,
            history=[],
            statistics=None,
        )

    history = [
        PriceHistoryEntrySchema(
            date=row.recorded_at,
            price=float(row.price),
            currency=row.currency,
            platform=row.platform,
            in_stock=row.in_stock,
        )
        for row in history_rows
    ]

    prices = [float(row.price) for row in history_rows]
    current = prices[-1]
    lowest = min(prices)
    highest = max(prices)
    average = sum(prices) / len(prices)

    first_price = prices[0]
    if first_price > 0:
        price_change = ((current - first_price) / first_price) * 100
    else:
        price_change = 0.0

    if price_change < -5:
        trend = "baisse"
    elif price_change > 5:
        trend = "hausse"
    else:
        trend = "stable"

    statistics = PriceHistoryStatisticsSchema(
        current_price=round(current, 2),
        lowest_price=round(lowest, 2),
        highest_price=round(highest, 2),
        average_price=round(average, 2),
        price_change_percent=round(price_change, 2),
        trend=trend,
        data_points=len(history),
        is_historical_low=abs(current - lowest) < 1e-6,
    )

    return PriceHistoryResponseSchema(
        product_id=product_id,
        period=period,
        history=history,
        statistics=statistics,
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "scraper.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level=settings.log_level.lower(),
    )

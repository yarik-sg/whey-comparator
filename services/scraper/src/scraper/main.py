from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .cache import cache
from .database import Product, get_session, init_models
from .scheduler import scheduler
from .schemas import ProductSchema, ProductWithOffersSchema
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

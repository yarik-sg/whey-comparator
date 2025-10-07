from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import Offer, PriceHistory, Product
from .normalization.product import NormalizedOffer, NormalizedProduct


async def upsert_product_with_offers(
    session: AsyncSession, product: NormalizedProduct
) -> Product:
    existing = await session.scalar(
        select(Product).where(Product.name == product.name, Product.brand == product.brand)
    )

    if existing is None:
        existing = Product(
            name=product.name,
            brand=product.brand,
            flavour=product.flavour,
            protein_per_serving_g=product.protein_per_serving_g,
            serving_size_g=product.serving_size_g,
            image=product.image,
            image_url=product.image_url or product.image,
        )
        session.add(existing)
        await session.flush()
    else:
        existing.flavour = product.flavour
        existing.protein_per_serving_g = product.protein_per_serving_g
        existing.serving_size_g = product.serving_size_g
        existing.image = product.image or existing.image
        existing.image_url = product.image_url or product.image or existing.image_url

    await _sync_offers(session, existing, product.offers)
    return existing


async def _sync_offers(
    session: AsyncSession, product: Product, offers: Iterable[NormalizedOffer]
) -> None:
    existing_offers = {offer.source: offer for offer in product.offers}

    for offer in offers:
        if offer.source in existing_offers:
            db_offer = existing_offers[offer.source]
            db_offer.price = offer.price
            db_offer.currency = offer.currency
            db_offer.price_per_100g_protein = offer.price_per_100g_protein
            db_offer.stock_status = offer.stock_status
            db_offer.url = offer.url
            db_offer.in_stock = offer.in_stock
            db_offer.shipping_cost = offer.shipping_cost
            db_offer.shipping_text = offer.shipping_text
            db_offer.image = offer.image or db_offer.image
        else:
            session.add(
                Offer(
                    product=product,
                    source=offer.source,
                    url=offer.url,
                    price=offer.price,
                    currency=offer.currency,
                    price_per_100g_protein=offer.price_per_100g_protein,
                    stock_status=offer.stock_status,
                    in_stock=offer.in_stock,
                    shipping_cost=offer.shipping_cost,
                    shipping_text=offer.shipping_text,
                    image=offer.image,
                )
            )

    await session.flush()
    await _record_price_history(session, product, offers)


async def _record_price_history(
    session: AsyncSession, product: Product, offers: Iterable[NormalizedOffer]
) -> None:
    best_offer: NormalizedOffer | None = None
    best_total: float | None = None

    for offer in offers:
        total = offer.price
        if offer.shipping_cost:
            total += offer.shipping_cost

        if best_total is None or total < best_total:
            best_total = total
            best_offer = offer

    if best_offer is None or best_total is None:
        return

    latest = await session.scalar(
        select(PriceHistory)
        .where(PriceHistory.product_id == product.id)
        .order_by(PriceHistory.recorded_at.desc())
    )

    if (
        latest
        and abs(latest.price - best_total) < 1e-6
        and latest.currency == best_offer.currency
        and latest.source == best_offer.source
    ):
        return

    session.add(
        PriceHistory(
            product=product,
            price=best_total,
            currency=best_offer.currency,
            source=best_offer.source,
        )
    )
    await session.flush()

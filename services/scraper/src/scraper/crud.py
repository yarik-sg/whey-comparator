from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import Offer, Product
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
        )
        session.add(existing)
        await session.flush()
    else:
        existing.flavour = product.flavour
        existing.protein_per_serving_g = product.protein_per_serving_g
        existing.serving_size_g = product.serving_size_g

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
                )
            )

    await session.flush()

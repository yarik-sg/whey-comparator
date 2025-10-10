from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from .collectors.amazon import AmazonCollector
from .collectors.myprotein import MyProteinCollector
from .crud import upsert_product_with_offers
from .database import PriceHistory, Product, get_session
from .settings import settings


class RefreshScheduler:
    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)
        self._collectors = [MyProteinCollector(), AmazonCollector()]

    def start(self) -> None:
        trigger = CronTrigger.from_crontab(settings.refresh_cron)
        self._scheduler.add_job(self.refresh_all, trigger=trigger, id="refresh-products", replace_existing=True)
        self._scheduler.add_job(
            self.record_daily_price_history,
            trigger=CronTrigger(hour=3, minute=0),
            id="record-price-history",
            replace_existing=True,
        )
        self._scheduler.start()

    async def shutdown(self) -> None:
        self._scheduler.shutdown(wait=False)

    async def refresh_all(self) -> None:
        tasks = [collector.collect() for collector in self._collectors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        async with get_session() as session:
            for result in results:
                if isinstance(result, Exception):
                    continue
                for product in result:
                    await upsert_product_with_offers(session, product)
            await session.commit()

        print(f"[{datetime.utcnow().isoformat()}] rafraîchissement terminé")

    async def record_daily_price_history(self) -> None:
        async with get_session() as session:
            result = await session.execute(
                select(Product).options(selectinload(Product.offers))
            )
            products = result.scalars().all()
            snapshot_time = datetime.now(timezone.utc)

            for product in products:
                for offer in product.offers:
                    if offer.price is None:
                        continue

                    session.add(
                        PriceHistory(
                            product_id=product.id,
                            platform=offer.source,
                            price=offer.price,
                            currency=offer.currency,
                            in_stock=offer.in_stock if offer.in_stock is not None else True,
                            recorded_at=snapshot_time,
                        )
                    )

            await session.commit()

        print(f"[{snapshot_time.isoformat()}] historique des prix mis à jour")


scheduler = RefreshScheduler()

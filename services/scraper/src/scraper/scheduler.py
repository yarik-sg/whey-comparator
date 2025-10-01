from __future__ import annotations

import asyncio
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .collectors.amazon import AmazonCollector
from .collectors.myprotein import MyProteinCollector
from .crud import upsert_product_with_offers
from .database import get_session
from .settings import settings


class RefreshScheduler:
    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)
        self._collectors = [MyProteinCollector(), AmazonCollector()]

    def start(self) -> None:
        trigger = CronTrigger.from_crontab(settings.refresh_cron)
        self._scheduler.add_job(self.refresh_all, trigger=trigger, id="refresh-products", replace_existing=True)
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


scheduler = RefreshScheduler()

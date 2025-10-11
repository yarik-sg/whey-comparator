"""Background scheduler integration for periodic maintenance tasks."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Dict, Optional


try:  # pragma: no cover - fallback handled in tests
    from apscheduler.schedulers.asyncio import AsyncIOScheduler as _AsyncIOScheduler  # type: ignore
    from apscheduler.triggers.cron import CronTrigger  # type: ignore
except Exception:  # pragma: no cover - APScheduler optional during tests
    _AsyncIOScheduler = None  # type: ignore[assignment]
    CronTrigger = None  # type: ignore[assignment]

from .tasks import check_alerts, save_daily_prices

logger = logging.getLogger(__name__)

SchedulerJobFunc = Callable[[], Awaitable[None] | None]


class _SimpleCronTrigger:
    """Minimal cron-like trigger used when APScheduler is unavailable."""

    def __init__(
        self,
        *,
        hour: Optional[int] = None,
        minute: int = 0,
        tz: timezone = timezone.utc,
    ) -> None:
        self.hour = hour
        self.minute = minute
        self.timezone = tz

    def get_next_fire_time(
        self, previous_fire_time: Optional[datetime], now: datetime
    ) -> datetime:
        reference = now.astimezone(self.timezone)
        target = reference.replace(second=0, microsecond=0)

        if self.hour is None:
            target = target.replace(minute=self.minute)
            if target <= reference:
                target += timedelta(hours=1)
        else:
            target = target.replace(hour=self.hour, minute=self.minute)
            if target <= reference:
                target += timedelta(days=1)

        return target.astimezone(timezone.utc)


class _SimpleJob:
    def __init__(
        self,
        *,
        job_id: str,
        func: SchedulerJobFunc,
        trigger: _SimpleCronTrigger,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        self.id = job_id
        self._func = func
        self._trigger = trigger
        self._loop = loop
        self._task: Optional[asyncio.Task[None]] = None
        self._cancelled = False
        self._previous_fire_time: Optional[datetime] = None

    def start(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> None:
        if self._task is not None:
            return
        if loop is not None:
            self._loop = loop
        if self._loop is None:
            self._loop = asyncio.get_running_loop()
        self._task = self._loop.create_task(self._run())

    async def _run(self) -> None:
        while not self._cancelled:
            now = datetime.now(timezone.utc)
            next_run = self._trigger.get_next_fire_time(self._previous_fire_time, now)
            delay = max(0.0, (next_run - now).total_seconds())
            try:
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                return

            self._previous_fire_time = next_run
            try:
                result = self._func()
                if asyncio.iscoroutine(result):
                    await result
            except Exception:  # pragma: no cover - defensive logging
                logger.exception("Scheduled job %s failed", self.id)

    def cancel(self) -> None:
        self._cancelled = True
        if self._task and not self._task.done():
            self._task.cancel()


class _SimpleAsyncScheduler:
    """Fallback scheduler relying solely on asyncio."""

    def __init__(self) -> None:
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._jobs: Dict[str, _SimpleJob] = {}
        self._running = False

    @property
    def running(self) -> bool:
        return self._running

    def add_job(
        self,
        func: SchedulerJobFunc,
        trigger: _SimpleCronTrigger,
        *,
        id: str,
        replace_existing: bool = False,
    ) -> _SimpleJob:
        if replace_existing and id in self._jobs:
            self.remove_job(id)
        job = _SimpleJob(job_id=id, func=func, trigger=trigger, loop=self._loop)
        self._jobs[id] = job
        if self._running:
            job.start(self._loop)
        return job

    def get_job(self, job_id: str) -> Optional[_SimpleJob]:
        return self._jobs.get(job_id)

    def remove_job(self, job_id: str) -> None:
        job = self._jobs.pop(job_id, None)
        if job:
            job.cancel()

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        if self._loop is None:
            self._loop = asyncio.get_running_loop()
        for job in self._jobs.values():
            job.start(self._loop)
        logger.info("Fallback scheduler started with %s job(s)", len(self._jobs))

    def shutdown(self) -> None:
        for job in list(self._jobs.values()):
            job.cancel()
        self._jobs.clear()
        self._running = False
        self._loop = None
        logger.info("Fallback scheduler stopped")


_scheduler_instance: Any = None


def _create_scheduler() -> Any:
    if _AsyncIOScheduler is not None:
        logger.info("Initialising APScheduler AsyncIOScheduler")
        return _AsyncIOScheduler(timezone=timezone.utc)

    logger.warning(
        "APScheduler is not available; using simplified asyncio-based scheduler instead."
    )
    return _SimpleAsyncScheduler()


def _ensure_trigger(hour: Optional[int], minute: int) -> Any:
    if CronTrigger is not None:
        return CronTrigger(hour=hour, minute=minute, timezone=timezone.utc)
    return _SimpleCronTrigger(hour=hour, minute=minute, tz=timezone.utc)


def get_scheduler() -> Any:
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = _create_scheduler()
    return _scheduler_instance


def start_scheduler() -> None:
    scheduler = get_scheduler()

    if getattr(scheduler, "running", False):
        return

    if scheduler.get_job("daily-price-history") is None:
        scheduler.add_job(
            save_daily_prices,
            _ensure_trigger(hour=3, minute=0),
            id="daily-price-history",
            replace_existing=True,
        )

    if scheduler.get_job("price-alert-monitor") is None:
        scheduler.add_job(
            check_alerts,
            _ensure_trigger(hour=None, minute=0),
            id="price-alert-monitor",
            replace_existing=True,
        )

    logger.info("Starting background scheduler (%s)", scheduler.__class__.__name__)
    scheduler.start()


def shutdown_scheduler() -> None:
    global _scheduler_instance
    if _scheduler_instance is None:
        return

    shutdown = getattr(_scheduler_instance, "shutdown", None)
    if callable(shutdown):
        logger.info(
            "Shutting down background scheduler (%s)",
            _scheduler_instance.__class__.__name__,
        )
        shutdown()
    _scheduler_instance = None


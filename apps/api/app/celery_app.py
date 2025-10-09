from celery import Celery
from celery.schedules import crontab

from .config import get_settings

settings = get_settings()

celery_app = Celery(
    "whey_comparator",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "record-daily-price-history": {
        "task": "app.tasks.record_daily_price_snapshot",
        "schedule": crontab(hour=9, minute=0),
    },
    "check-price-alerts": {
        "task": "app.tasks.check_price_alerts",
        "schedule": crontab(hour="*/4", minute=0),
    },
}

celery_app.autodiscover_tasks(["app"])

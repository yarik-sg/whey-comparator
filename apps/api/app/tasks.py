from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from .celery_app import celery_app
from .database import SessionLocal
from .models import Offer, PriceAlert, PriceHistory, Product, ScrapeJob, Supplier
from .email import send_price_alert_notification


@celery_app.task(name="app.tasks.run_scrape_job")
def run_scrape_job(job_id: Optional[int] = None, *, product_id: Optional[int] = None, supplier_id: Optional[int] = None, offer_id: Optional[int] = None) -> int:
    """Simulate a scraping job and store logs in the database."""
    session = SessionLocal()
    try:
        if job_id:
            job = session.get(ScrapeJob, job_id)
        else:
            job = ScrapeJob(product_id=product_id, supplier_id=supplier_id, offer_id=offer_id)
            session.add(job)
            session.commit()
            session.refresh(job)

        job.started_at = datetime.utcnow()
        job.status = "running"
        session.add(job)
        session.commit()

        log_lines = ["Scraping started"]
        if job.product_id:
            product = session.execute(select(Product).where(Product.id == job.product_id)).scalar_one_or_none()
            if product:
                log_lines.append(f"Product: {product.name}")
        if job.supplier_id:
            supplier = session.execute(select(Supplier).where(Supplier.id == job.supplier_id)).scalar_one_or_none()
            if supplier:
                log_lines.append(f"Supplier: {supplier.name}")
        if job.offer_id:
            offer = session.execute(select(Offer).where(Offer.id == job.offer_id)).scalar_one_or_none()
            if offer:
                log_lines.append(f"Offer price: {offer.price}")

        # Simulate scraping result
        success = random.random() > 0.1
        if success:
            log_lines.append("Scraping completed successfully")
            job.status = "succeeded"
        else:
            log_lines.append("Scraping failed")
            job.status = "failed"

        job.finished_at = datetime.utcnow()
        job.log = "\n".join(log_lines)
        session.add(job)
        session.commit()
        return job.id
    finally:
        session.close()


def _format_price(amount: Optional[float], currency: str | None) -> str:
    if amount is None:
        return "N/A"
    currency_code = currency or "EUR"
    return f"{amount:.2f} {currency_code}"


@celery_app.task(name="app.tasks.record_daily_price_snapshot")
def record_daily_price_snapshot() -> None:
    """Capture the best available offer for every product to feed the history chart."""

    session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        products = (
            session.execute(
                select(Product).options(selectinload(Product.offers).selectinload(Offer.supplier))
            )
            .scalars()
            .all()
        )

        for product in products:
            if not product.offers:
                continue

            best_offer = min(product.offers, key=lambda offer: float(offer.price))
            history_entry = PriceHistory(
                product_id=product.id,
                platform=best_offer.supplier.name if best_offer.supplier else None,
                price=best_offer.price,
                currency=best_offer.currency,
                in_stock=best_offer.available,
                recorded_at=now,
            )
            session.add(history_entry)

            product.price = best_offer.price
            product.currency = best_offer.currency
            product.in_stock = best_offer.available
            product.updated_at = now

        session.commit()
    finally:
        session.close()


@celery_app.task(name="app.tasks.check_price_alerts")
def check_price_alerts() -> None:
    """Evaluate active price alerts and deactivate those that should trigger."""

    session = SessionLocal()
    try:
        alerts = (
            session.execute(
                select(PriceAlert)
                .options(
                    selectinload(PriceAlert.product).selectinload(Product.offers).selectinload(Offer.supplier)
                )
                .where(PriceAlert.active.is_(True))
            )
            .scalars()
            .all()
        )

        now = datetime.now(timezone.utc)
        triggered = 0

        for alert in alerts:
            product = alert.product
            if not product or not product.offers:
                continue

            best_offer = min(product.offers, key=lambda offer: float(offer.price))
            if best_offer.price <= alert.target_price:
                alert.active = False
                alert.updated_at = now
                triggered += 1

                target_display = _format_price(float(alert.target_price), best_offer.currency)
                current_display = _format_price(float(best_offer.price), best_offer.currency)
                send_price_alert_notification(
                    recipient=alert.user_email,
                    product_name=product.name,
                    target_price=target_display,
                    current_price=current_display,
                    offer_url=best_offer.url,
                )

        session.commit()
        if triggered:
            print(f"{triggered} price alert(s) triggered")
    finally:
        session.close()


def save_daily_prices() -> None:
    """Persist daily price snapshots synchronously (for APScheduler)."""

    record_daily_price_snapshot.run()


def check_alerts() -> None:
    """Evaluate price alerts synchronously (for APScheduler)."""

    check_price_alerts.run()

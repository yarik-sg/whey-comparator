from __future__ import annotations

import random
from datetime import datetime
from typing import Optional

from sqlalchemy import select

from .celery_app import celery_app
from .database import SessionLocal
from .models import Offer, Product, ScrapeJob, Supplier


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

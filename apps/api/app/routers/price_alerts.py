from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .. import schemas
from ..database import get_db
from ..models import PriceAlert, Product
from .products import _build_product_summary

router = APIRouter()


def _serialize_alert(alert: PriceAlert) -> schemas.PriceAlertRead:
    product_summary = (
        _build_product_summary(alert.product) if alert.product is not None else None
    )
    return schemas.PriceAlertRead(
        id=alert.id,
        user_email=alert.user_email,
        product_id=alert.product_id,
        target_price=alert.target_price,
        platform=alert.platform,
        active=alert.active,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
        product=product_summary,
    )


@router.post("/", response_model=schemas.PriceAlertRead, status_code=201)
def create_price_alert(
    payload: schemas.PriceAlertCreate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    alert = PriceAlert(**payload.model_dump())
    db.add(alert)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Alert already exists") from exc
    db.refresh(alert)
    db.refresh(alert, attribute_names=["product"])
    return _serialize_alert(alert)


@router.get("/", response_model=list[schemas.PriceAlertRead])
def list_price_alerts(
    product_id: int | None = Query(default=None),
    email: str | None = Query(default=None, alias="user_email"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    query = select(PriceAlert).options(selectinload(PriceAlert.product))
    if product_id is not None:
        query = query.where(PriceAlert.product_id == product_id)
    if email is not None:
        query = query.where(PriceAlert.user_email == email)

    alerts = db.execute(query).scalars().all()
    return [_serialize_alert(alert) for alert in alerts]


@router.patch("/{alert_id}", response_model=schemas.PriceAlertRead)
def update_price_alert(
    alert_id: int,
    payload: schemas.PriceAlertUpdate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    alert = db.get(PriceAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    updated = False
    if payload.active is not None and payload.active != alert.active:
        alert.active = payload.active
        updated = True

    if updated:
        db.add(alert)
        db.commit()
        db.refresh(alert)

    db.refresh(alert, attribute_names=["product"])
    return _serialize_alert(alert)


@router.delete("/{alert_id}", status_code=204)
def delete_price_alert(alert_id: int, db: Annotated[Session, Depends(get_db)] = None):
    alert = db.get(PriceAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return None

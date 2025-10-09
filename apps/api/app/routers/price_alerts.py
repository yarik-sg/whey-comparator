from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import PriceAlert, Product

router = APIRouter()


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
    return alert


@router.get("/", response_model=list[schemas.PriceAlertRead])
def list_price_alerts(
    product_id: int | None = Query(default=None),
    email: str | None = Query(default=None, alias="user_email"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    query = select(PriceAlert)
    if product_id is not None:
        query = query.where(PriceAlert.product_id == product_id)
    if email is not None:
        query = query.where(PriceAlert.user_email == email)

    alerts = db.execute(query).scalars().all()
    return [schemas.PriceAlertRead.model_validate(alert) for alert in alerts]

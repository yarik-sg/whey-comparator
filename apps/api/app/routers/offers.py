from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, asc, desc, func, select
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Offer

router = APIRouter()


@router.get("/", response_model=schemas.PaginatedOffers)
def list_offers(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    product_id: int | None = Query(default=None),
    supplier_id: int | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    available: bool | None = None,
    sort_by: str = Query("created_at", pattern="^(price|created_at|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    base_query = select(Offer)

    filters = []
    if product_id is not None:
        filters.append(Offer.product_id == product_id)
    if supplier_id is not None:
        filters.append(Offer.supplier_id == supplier_id)
    if min_price is not None:
        filters.append(Offer.price >= min_price)
    if max_price is not None:
        filters.append(Offer.price <= max_price)
    if available is not None:
        filters.append(Offer.available == available)

    if filters:
        base_query = base_query.where(and_(*filters))

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    sort_column = getattr(Offer, sort_by)
    ordered_query = base_query.order_by(
        asc(sort_column) if sort_order == "asc" else desc(sort_column)
    )

    items = db.execute(ordered_query.offset(offset).limit(limit)).scalars().all()
    return schemas.PaginatedOffers(
        total=total,
        items=[schemas.OfferRead.model_validate(item) for item in items],
    )


@router.post("/", response_model=schemas.OfferRead, status_code=201)
def create_offer(
    payload: schemas.OfferCreate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    offer = Offer(**payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/{offer_id}", response_model=schemas.OfferRead)
def get_offer(offer_id: int, db: Annotated[Session, Depends(get_db)] = None):
    offer = db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.put("/{offer_id}", response_model=schemas.OfferRead)
def update_offer(
    offer_id: int,
    payload: schemas.OfferUpdate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    offer = db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(offer, field, value)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/{offer_id}", status_code=204)
def delete_offer(offer_id: int, db: Annotated[Session, Depends(get_db)] = None):
    offer = db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    db.delete(offer)
    db.commit()
    return None

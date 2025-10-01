from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Product

router = APIRouter()


@router.get("/", response_model=schemas.PaginatedProducts)
def list_products(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    sort_by: str = Query("created_at", regex="^(name|created_at|updated_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    base_query = select(Product)
    if search:
        base_query = base_query.where(Product.name.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    sort_column = getattr(Product, sort_by)
    ordered_query = base_query.order_by(
        asc(sort_column) if sort_order == "asc" else desc(sort_column)
    )

    items = db.execute(ordered_query.offset(offset).limit(limit)).scalars().all()
    return schemas.PaginatedProducts(
        total=total,
        items=[schemas.ProductRead.model_validate(item) for item in items],
    )


@router.post("/", response_model=schemas.ProductRead, status_code=201)
def create_product(
    payload: schemas.ProductCreate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)] = None):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Annotated[Session, Depends(get_db)] = None):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None

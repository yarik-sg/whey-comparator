from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Supplier

router = APIRouter()


@router.get("/", response_model=schemas.PaginatedSuppliers)
def list_suppliers(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    sort_by: str = Query("created_at", pattern="^(name|created_at|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    base_query = select(Supplier)
    if search:
        pattern = f"%{search}%"
        base_query = base_query.where(
            Supplier.name.ilike(pattern) | Supplier.website.ilike(pattern)
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    sort_column = getattr(Supplier, sort_by)
    ordered_query = base_query.order_by(
        asc(sort_column) if sort_order == "asc" else desc(sort_column)
    )

    items = db.execute(ordered_query.offset(offset).limit(limit)).scalars().all()
    return schemas.PaginatedSuppliers(
        total=total,
        items=[schemas.SupplierRead.model_validate(item) for item in items],
    )


@router.post("/", response_model=schemas.SupplierRead, status_code=201)
def create_supplier(
    payload: schemas.SupplierCreate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=schemas.SupplierRead)
def get_supplier(supplier_id: int, db: Annotated[Session, Depends(get_db)] = None):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=schemas.SupplierRead)
def update_supplier(
    supplier_id: int,
    payload: schemas.SupplierUpdate,
    db: Annotated[Session, Depends(get_db)] = None,
):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Annotated[Session, Depends(get_db)] = None):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return None

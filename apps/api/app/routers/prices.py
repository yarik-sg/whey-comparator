from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from .products import PRICE_HISTORY_PERIODS, build_price_history_response

router = APIRouter()


@router.get("/history/{product_id}", response_model=schemas.PriceHistoryResponse)
def get_price_history_for_product(
    product_id: int,
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    return build_price_history_response(db, product_id, period)


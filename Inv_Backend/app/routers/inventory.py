from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.inventory import StockAdjustment, InventoryItemResponse, InventoryListResponse
from app.services import inventory_service

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory"])


def _serialize(product) -> InventoryItemResponse:
    return InventoryItemResponse(
        id=product.id,
        name=product.name,
        sku=product.sku,
        price=product.price,
        stock_quantity=product.stock_quantity,
        is_low_stock=inventory_service.is_low_stock(product),
        updated_at=product.updated_at,
    )


@router.get("/", response_model=InventoryListResponse)
def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    products, total = inventory_service.list_inventory(db, skip=skip, limit=limit)
    return InventoryListResponse(
        data=[_serialize(p) for p in products],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/low-stock", response_model=InventoryListResponse)
def get_low_stock(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    products, total = inventory_service.get_low_stock(db, skip=skip, limit=limit)
    return InventoryListResponse(
        data=[_serialize(p) for p in products],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.put("/{product_id}", response_model=InventoryItemResponse)
def adjust_stock(product_id: str, payload: StockAdjustment, db: Session = Depends(get_db)):
    product = inventory_service.adjust_stock(db, product_id, payload)
    return _serialize(product)
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services import product_service

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


@router.get("/", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return"),
    name: Optional[str] = Query(None, description="Filter by product name (partial match)"),
    sku: Optional[str] = Query(None, description="Filter by SKU (partial match)"),
    db: Session = Depends(get_db),
):
    products, total = product_service.list_products(db, skip=skip, limit=limit, name=name, sku=sku)
    return ProductListResponse(
        data=products,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    return product_service.get_product_or_404(db, product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, payload)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db)):
    return product_service.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product_service.delete_product(db, product_id)
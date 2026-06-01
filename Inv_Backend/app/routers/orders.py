from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderListResponse, OrderItemResponse
from app.models.order import OrderStatus
from app.services import order_service

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


def _serialize_order(order) -> dict:
    """Build OrderResponse-compatible dict with nested info."""
    items = []
    for item in order.items:
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else None,
            product_sku=item.product.sku if item.product else None,
        ))

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        customer_name=order.customer.name if order.customer else None,
        customer_email=order.customer.email if order.customer else None,
    )


@router.get("/", response_model=OrderListResponse)
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    db: Session = Depends(get_db),
):
    orders, total = order_service.list_orders(db, skip=skip, limit=limit, status=status, customer_id=customer_id)
    return OrderListResponse(
        data=[_serialize_order(o) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = order_service.get_order_or_404(db, order_id)
    return _serialize_order(order)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    order = order_service.create_order(db, payload)
    return _serialize_order(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = order_service.update_order_status(db, order_id, payload)
    return _serialize_order(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    order_service.delete_order(db, order_id)
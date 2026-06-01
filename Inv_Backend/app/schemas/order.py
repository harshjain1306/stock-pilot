from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    quantity: int
    unit_price: Decimal

    # Nested product info
    product_name: Optional[str] = None
    product_sku: Optional[str] = None


class OrderCreate(BaseModel):
    customer_id: str
    items: list[OrderItemCreate] = Field(..., min_length=1)
    notes: Optional[str] = Field(None, max_length=500)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    status: OrderStatus
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    # Nested customer info
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None


class OrderListResponse(BaseModel):
    data: list[OrderResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
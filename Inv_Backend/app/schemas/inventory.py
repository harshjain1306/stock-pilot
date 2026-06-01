from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class StockAdjustmentType(str, Enum):
    add = "add"
    subtract = "subtract"
    set = "set"


class StockAdjustment(BaseModel):
    adjustment_type: StockAdjustmentType
    quantity: int = Field(..., ge=0)
    reason: Optional[str] = Field(None, max_length=300)


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sku: str
    price: Decimal
    stock_quantity: int
    is_low_stock: bool
    updated_at: datetime


class InventoryListResponse(BaseModel):
    data: list[InventoryItemResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
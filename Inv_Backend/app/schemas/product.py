import re
from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, Field, ConfigDict


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    sku: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock_quantity: int = Field(..., ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9\-]+$", v):
            raise ValueError("SKU must contain only alphanumeric characters and hyphens")
        return v.upper()

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return round(v, 2)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    sku: Optional[str] = Field(None, min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(r"^[a-zA-Z0-9\-]+$", v):
                raise ValueError("SKU must contain only alphanumeric characters and hyphens")
            return v.upper()
        return v


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    data: list[ProductResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
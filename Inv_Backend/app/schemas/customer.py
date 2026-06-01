import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, Field, ConfigDict


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
            if not cleaned.isdigit():
                raise ValueError("Phone must contain only digits, spaces, hyphens, parentheses, or +")
            if not (7 <= len(cleaned) <= 15):
                raise ValueError("Phone must be between 7 and 15 digits")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
            if not cleaned.isdigit():
                raise ValueError("Phone must contain only digits, spaces, hyphens, parentheses, or +")
            if not (7 <= len(cleaned) <= 15):
                raise ValueError("Phone must be between 7 and 15 digits")
        return v


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    data: list[CustomerResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
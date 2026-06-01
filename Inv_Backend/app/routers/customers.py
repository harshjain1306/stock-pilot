from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.services import customer_service

router = APIRouter(prefix="/api/v1/customers", tags=["Customers"])


@router.get("/", response_model=CustomerListResponse)
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    name: Optional[str] = Query(None, description="Filter by name (partial match)"),
    email: Optional[str] = Query(None, description="Filter by email (partial match)"),
    db: Session = Depends(get_db),
):
    customers, total = customer_service.list_customers(db, skip=skip, limit=limit, name=name, email=email)
    return CustomerListResponse(
        data=customers,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    return customer_service.get_customer_or_404(db, customer_id)


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return customer_service.create_customer(db, payload)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, payload: CustomerUpdate, db: Session = Depends(get_db)):
    return customer_service.update_customer(db, customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    customer_service.delete_customer(db, customer_id)
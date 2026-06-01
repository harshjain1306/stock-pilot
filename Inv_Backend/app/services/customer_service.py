from sqlalchemy.orm import Session
from typing import Optional
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.exceptions import NotFoundError, ConflictError


def get_customer_or_404(db: Session, customer_id: str) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise NotFoundError(f"Customer with id '{customer_id}' not found")
    return customer


def check_email_unique(db: Session, email: str, exclude_id: Optional[str] = None):
    query = db.query(Customer).filter(Customer.email == email.lower())
    if exclude_id:
        query = query.filter(Customer.id != exclude_id)
    if query.first():
        raise ConflictError(f"Customer with email '{email}' already exists")


def list_customers(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    name: Optional[str] = None,
    email: Optional[str] = None,
):
    query = db.query(Customer)

    if name:
        query = query.filter(Customer.name.ilike(f"%{name}%"))
    if email:
        query = query.filter(Customer.email.ilike(f"%{email}%"))

    total = query.count()
    customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
    return customers, total


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    check_email_unique(db, str(payload.email))

    customer = Customer(
        name=payload.name,
        email=str(payload.email).lower(),
        phone=payload.phone,
        address=payload.address,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: str, payload: CustomerUpdate) -> Customer:
    customer = get_customer_or_404(db, customer_id)

    if payload.email is not None:
        check_email_unique(db, str(payload.email), exclude_id=customer_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value:
            value = str(value).lower()
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: str):
    customer = get_customer_or_404(db, customer_id)

    active_order_count = (
        db.query(Order)
        .filter(
            Order.customer_id == customer_id,
            Order.status != OrderStatus.cancelled,
        )
        .count()
    )
    if active_order_count > 0:
        raise ConflictError(
            f"Cannot delete customer '{customer.name}' — they have {active_order_count} active order(s)"
        )

    db.delete(customer)
    db.commit()
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.product import ProductCreate, ProductUpdate
from app.exceptions import NotFoundError, ConflictError, BusinessRuleError


def get_product_or_404(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")
    return product


def check_sku_unique(db: Session, sku: str, exclude_id: Optional[str] = None):
    query = db.query(Product).filter(Product.sku == sku.upper())
    if exclude_id:
        query = query.filter(Product.id != exclude_id)
    if query.first():
        raise ConflictError(f"Product with SKU '{sku.upper()}' already exists")


def list_products(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    name: Optional[str] = None,
    sku: Optional[str] = None,
):
    query = db.query(Product)

    if name:
        query = query.filter(Product.name.ilike(f"%{name}%"))
    if sku:
        query = query.filter(Product.sku.ilike(f"%{sku}%"))

    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()

    return products, total


def create_product(db: Session, payload: ProductCreate) -> Product:
    check_sku_unique(db, payload.sku)

    product = Product(
        name=payload.name,
        sku=payload.sku.upper(),
        description=payload.description,
        price=float(payload.price),
        stock_quantity=payload.stock_quantity,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: str, payload: ProductUpdate) -> Product:
    product = get_product_or_404(db, product_id)

    if payload.sku is not None:
        check_sku_unique(db, payload.sku, exclude_id=product_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "sku" and value:
            value = value.upper()
        if field == "price" and value:
            value = float(value)
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: str):
    product = get_product_or_404(db, product_id)

    # Block delete if product exists in active (non-cancelled) orders
    active_order_count = (
        db.query(OrderItem)
        .join(Order)
        .filter(
            OrderItem.product_id == product_id,
            Order.status != OrderStatus.cancelled,
        )
        .count()
    )
    if active_order_count > 0:
        raise ConflictError(
            f"Cannot delete product '{product.name}' — it exists in {active_order_count} active order(s)"
        )

    db.delete(product)
    db.commit()
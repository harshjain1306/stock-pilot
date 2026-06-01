from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.order import Order, OrderItem, OrderStatus, VALID_TRANSITIONS
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.exceptions import NotFoundError, ConflictError, BusinessRuleError, InsufficientStockError


def get_order_or_404(db: Session, order_id: str) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise NotFoundError(f"Order with id '{order_id}' not found")
    return order


def _build_order_response(order: Order) -> dict:
    """Enrich order with nested customer and product details."""
    return order


def list_orders(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    status: Optional[OrderStatus] = None,
    customer_id: Optional[str] = None,
):
    query = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
    )

    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders, total


def create_order(db: Session, payload: OrderCreate) -> Order:
    # 1. Validate customer exists
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise NotFoundError(f"Customer with id '{payload.customer_id}' not found")

    # 2. Validate all items — fetch products and check stock BEFORE touching anything
    product_map = {}
    errors = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            errors.append(f"Product with id '{item.product_id}' not found")
            continue

        if product.stock_quantity < item.quantity:
            errors.append(
                f"Insufficient stock for '{product.name}'. "
                f"Available: {product.stock_quantity}, Requested: {item.quantity}"
            )
            continue

        product_map[item.product_id] = product

    # Return ALL errors at once so client can fix everything in one go
    if errors:
        raise BusinessRuleError(
            message="Order validation failed",
            details={"stock_errors": errors},
        )

    # 3. Create order
    order = Order(
        customer_id=payload.customer_id,
        status=OrderStatus.pending,
        total_amount=0,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()  # Get order.id without committing

    # 4. Create items + deduct stock + calculate total
    total = 0.0
    for item in payload.items:
        product = product_map[item.product_id]
        unit_price = float(product.price)

        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=unit_price,
        )
        db.add(order_item)

        # Deduct stock
        product.stock_quantity -= item.quantity
        total += unit_price * item.quantity

    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)

    # Reload with relationships
    return get_order_or_404(db, order.id)


def update_order_status(db: Session, order_id: str, payload: OrderStatusUpdate) -> Order:
    order = get_order_or_404(db, order_id)
    current_status = order.status
    new_status = payload.status

    # Validate transition
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise BusinessRuleError(
            f"Cannot transition order from '{current_status.value}' to '{new_status.value}'. "
            f"Allowed transitions: {[s.value for s in allowed] or 'none'}"
        )

    # Restore stock if cancelling
    if new_status == OrderStatus.cancelled:
        _restore_stock(db, order)

    order.status = new_status
    db.commit()
    db.refresh(order)
    return get_order_or_404(db, order.id)


def delete_order(db: Session, order_id: str):
    """Cancel and delete an order, restoring stock."""
    order = get_order_or_404(db, order_id)

    if order.status == OrderStatus.cancelled:
        raise BusinessRuleError("Order is already cancelled")

    # Restore stock before deletion
    _restore_stock(db, order)

    db.delete(order)
    db.commit()


def _restore_stock(db: Session, order: Order):
    """Restore stock quantities for all items in an order."""
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
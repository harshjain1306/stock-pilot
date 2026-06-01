from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.inventory import StockAdjustment, StockAdjustmentType
from app.exceptions import NotFoundError, BusinessRuleError
from app.config import settings


def list_inventory(db: Session, skip: int = 0, limit: int = 10):
    query = db.query(Product)
    total = query.count()
    products = query.order_by(Product.name).offset(skip).limit(limit).all()
    return products, total


def get_low_stock(db: Session, skip: int = 0, limit: int = 10):
    threshold = settings.LOW_STOCK_THRESHOLD
    query = db.query(Product).filter(Product.stock_quantity <= threshold)
    total = query.count()
    products = query.order_by(Product.stock_quantity.asc()).offset(skip).limit(limit).all()
    return products, total


def adjust_stock(db: Session, product_id: str, payload: StockAdjustment) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    if payload.adjustment_type == StockAdjustmentType.add:
        product.stock_quantity += payload.quantity

    elif payload.adjustment_type == StockAdjustmentType.subtract:
        if product.stock_quantity < payload.quantity:
            raise BusinessRuleError(
                f"Cannot subtract {payload.quantity} from stock. "
                f"Current stock: {product.stock_quantity}"
            )
        product.stock_quantity -= payload.quantity

    elif payload.adjustment_type == StockAdjustmentType.set:
        product.stock_quantity = payload.quantity

    db.commit()
    db.refresh(product)
    return product


def is_low_stock(product: Product) -> bool:
    return product.stock_quantity <= settings.LOW_STOCK_THRESHOLD
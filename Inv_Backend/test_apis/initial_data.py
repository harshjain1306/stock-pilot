"""
Prepare a clean database for the API integration test suite.

Run from the project root before `api_tests.py`:

    python test_apis/initial_data.py

The API tests create their own products, customers, and orders so they can
capture generated IDs and exercise duplicate/conflict paths. This script only
initializes the schema and removes existing rows from the application tables.
"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import delete

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import settings
from app.database import Base, SessionLocal, engine

# Import models so SQLAlchemy registers every table on Base.metadata.
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product


TABLE_DELETE_ORDER = (
    OrderItem,
    Order,
    Product,
    Customer,
)


def initialize_schema() -> None:
    """Create tables that do not already exist."""
    Base.metadata.create_all(bind=engine)


def clear_application_data() -> None:
    """Delete rows in foreign-key-safe order."""
    db = SessionLocal()
    try:
        for model in TABLE_DELETE_ORDER:
            db.execute(delete(model))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    print("Preparing API test database")
    print(f"Database: {settings.DATABASE_URL}")

    initialize_schema()
    clear_application_data()

    print("Done. Schema is ready and test tables are empty.")


if __name__ == "__main__":
    main()

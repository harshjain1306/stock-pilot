# Inventory & Order Management System — Backend

A production-grade REST API built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Config | pydantic-settings + .env |

---

## Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally (or via Docker)

### 2. Clone & Install

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

### 4. Create Database

```sql
CREATE DATABASE inventory_db;
```

### 5. Run Migrations

```bash
alembic upgrade head
```

### 6. Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

---

## Test APIs Folder

The `test_apis/` folder contains scripts for preparing the database and running end-to-end API checks against the running FastAPI server.

| File | Description |
|---|---|
| `initial_data.py` | Creates missing tables and clears existing product, customer, order, and order item rows so tests start from a clean state. |
| `api_tests.py` | Runs the full API test suite using HTTP requests against `http://localhost:8000`. It covers health checks, products, customers, orders, inventory, status transitions, stock updates, and delete protection. |

Run the tests:

```bash
python test_apis/initial_data.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
python test_apis/api_tests.py
```

Make sure PostgreSQL is running and `.env` contains a valid `DATABASE_URL` before running these scripts.

---

## API Endpoints

### Products `/api/v1/products`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all products (paginated, filter by name/sku) |
| GET | `/{id}` | Get single product |
| POST | `/` | Create product |
| PUT | `/{id}` | Update product |
| DELETE | `/{id}` | Delete product |

### Customers `/api/v1/customers`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all customers (paginated, filter by name/email) |
| GET | `/{id}` | Get single customer |
| POST | `/` | Create customer |
| PUT | `/{id}` | Update customer |
| DELETE | `/{id}` | Delete customer |

### Orders `/api/v1/orders`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all orders (paginated, filter by status/customer_id) |
| GET | `/{id}` | Get order with items |
| POST | `/` | Create order (validates + deducts stock) |
| PUT | `/{id}/status` | Update order status |
| DELETE | `/{id}` | Cancel order + restore stock |

### Inventory `/api/v1/inventory`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all products with stock |
| GET | `/low-stock` | Products at or below threshold (default: 10) |
| PUT | `/{product_id}` | Adjust stock (add / subtract / set) |

---

## Business Rules

1. **Unique SKU** — 409 Conflict on duplicate
2. **Unique Email** — 409 Conflict on duplicate
3. **Stock Validation** — All items validated before any stock is deducted
4. **Auto Stock Deduction** — Stock reduced atomically on order creation
5. **Stock Restore** — Stock restored when order is cancelled or deleted
6. **Status Transitions** — Only valid: `pending→confirmed→shipped→delivered`, `pending/confirmed→cancelled`
7. **Delete Protection** — Cannot delete products/customers with active orders

---

## Pagination

All list endpoints support:

```
GET /api/v1/products?skip=0&limit=10
```

Response format:
```json
{
  "data": [...],
  "total": 100,
  "skip": 0,
  "limit": 10,
  "has_more": true
}
```

---

## Error Response Format

```json
{
  "error": true,
  "status_code": 404,
  "message": "Product not found",
  "details": {}
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `SUPABASE_URL` | optional | Supabase project API URL |
| `SUPABASE_KEY` | optional | Supabase publishable API key |
| `APP_ENV` | `development` | Environment name |
| `APP_HOST` | `0.0.0.0` | Server host |
| `APP_PORT` | `8000` | Server port |
| `LOW_STOCK_THRESHOLD` | `10` | Units below which product is "low stock" |
| `APP_NAME` | `Inventory & Order Management API` | App display name |
| `APP_VERSION` | `1.0.0` | App version |

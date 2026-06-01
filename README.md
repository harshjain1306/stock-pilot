# Stock Pilot — Inventory & Order Management System

A full-stack inventory and order management system with a **React + Vite** frontend and a **FastAPI + PostgreSQL** backend.

---

## Live Deployment

| | Link |
|---|---|
| Frontend | https://inv-sand.vercel.app/ |
| Backend API | https://inv-backend-ccy7.onrender.com |
| Docker Image | https://hub.docker.com/r/heria021/inv-backend |

---

## Repository Structure

```
stock-pilot/
├── Inv_Frontend/   # React + Vite frontend
└── Inv_Backend/    # FastAPI + PostgreSQL backend
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI 0.111 |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Config | pydantic-settings + .env |

---

## Frontend Setup

```bash
cd Inv_Frontend
npm install
npm run dev
```

---

## Backend Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally (or via Docker)

### 2. Install Dependencies

```bash
cd Inv_Backend
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

API Docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

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

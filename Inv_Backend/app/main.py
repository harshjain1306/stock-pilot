from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_tables
from app.exceptions.handlers import register_exception_handlers
from app.routers import products, customers, orders, inventory

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A production-grade Inventory & Order Management System API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()


# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception Handlers ─────────────────────────────────────────────────────────
register_exception_handlers(app)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(inventory.router)


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }
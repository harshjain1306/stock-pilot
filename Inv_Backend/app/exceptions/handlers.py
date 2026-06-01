from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


# ── Custom Exceptions ──────────────────────────────────────────────────────────

class NotFoundError(Exception):
    def __init__(self, message: str):
        self.message = message


class ConflictError(Exception):
    def __init__(self, message: str):
        self.message = message


class BusinessRuleError(Exception):
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}


class InsufficientStockError(Exception):
    def __init__(self, product_name: str, available: int, requested: int):
        self.product_name = product_name
        self.available = available
        self.requested = requested
        self.message = (
            f"Insufficient stock for '{product_name}'. "
            f"Available: {available}, Requested: {requested}"
        )


# ── Error Response Helper ──────────────────────────────────────────────────────

def error_response(status_code: int, message: str, details: dict = None):
    content = {"error": True, "status_code": status_code, "message": message}
    if details:
        content["details"] = details
    return JSONResponse(status_code=status_code, content=content)


# ── Register Handlers ──────────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI):

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return error_response(404, exc.message)

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError):
        return error_response(409, exc.message)

    @app.exception_handler(BusinessRuleError)
    async def business_rule_handler(request: Request, exc: BusinessRuleError):
        return error_response(400, exc.message, exc.details)

    @app.exception_handler(InsufficientStockError)
    async def insufficient_stock_handler(request: Request, exc: InsufficientStockError):
        return error_response(400, exc.message, {
            "product_name": exc.product_name,
            "available": exc.available,
            "requested": exc.requested,
        })

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in err["loc"]),
                "message": err["msg"],
            })
        return error_response(422, "Validation failed", {"errors": errors})

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        return error_response(409, "Database integrity error. Duplicate value or constraint violation.")

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return error_response(500, "Internal server error", {"detail": str(exc)})
"""
=============================================================
  Inventory & Order Management System — Full API Test Suite
=============================================================
Tests every endpoint with request + response printed clearly.
Run: python test_api.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# ── Terminal Colors ────────────────────────────────────────
class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    GREEN   = "\033[92m"
    RED     = "\033[91m"
    YELLOW  = "\033[93m"
    CYAN    = "\033[96m"
    MAGENTA = "\033[95m"
    BLUE    = "\033[94m"
    WHITE   = "\033[97m"
    DIM     = "\033[2m"

# ── State (IDs stored across tests) ───────────────────────
state = {
    "product_id_1": None,
    "product_id_2": None,
    "product_id_3": None,
    "customer_id_1": None,
    "customer_id_2": None,
    "order_id_1": None,
    "order_id_2": None,
}

# ── Counters ───────────────────────────────────────────────
passed = 0
failed = 0

# ══════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════

def banner(title: str):
    print(f"\n{C.BOLD}{C.MAGENTA}{'═' * 60}{C.RESET}")
    print(f"{C.BOLD}{C.MAGENTA}  {title}{C.RESET}")
    print(f"{C.BOLD}{C.MAGENTA}{'═' * 60}{C.RESET}")


def section(title: str):
    print(f"\n{C.BOLD}{C.CYAN}── {title} {'─' * (54 - len(title))}{C.RESET}")


def print_request(method: str, url: str, body: dict = None):
    method_colors = {
        "GET": C.GREEN, "POST": C.BLUE,
        "PUT": C.YELLOW, "DELETE": C.RED,
    }
    color = method_colors.get(method, C.WHITE)
    print(f"\n  {C.BOLD}{color}{method:<7}{C.RESET} {C.WHITE}{url}{C.RESET}")
    if body:
        print(f"  {C.DIM}Body:{C.RESET}")
        for line in json.dumps(body, indent=4).splitlines():
            print(f"    {C.DIM}{line}{C.RESET}")


def print_response(resp: requests.Response, label: str, expect: int):
    global passed, failed

    status = resp.status_code
    ok = status == expect

    if ok:
        passed += 1
        status_str = f"{C.GREEN}✅ {status}{C.RESET}"
    else:
        failed += 1
        status_str = f"{C.RED}❌ {status} (expected {expect}){C.RESET}"

    print(f"  {C.BOLD}{label}{C.RESET} → {status_str}")

    try:
        body = resp.json()
        pretty = json.dumps(body, indent=4, default=str)
        lines = pretty.splitlines()
        # Print first 30 lines max
        for line in lines[:30]:
            print(f"    {C.DIM}{line}{C.RESET}")
        if len(lines) > 30:
            print(f"    {C.DIM}... ({len(lines) - 30} more lines){C.RESET}")
    except Exception:
        print(f"    {C.DIM}(no JSON body){C.RESET}")

    return resp


def call(method: str, path: str, label: str, expect: int = 200, body: dict = None):
    url = f"{BASE_URL}{path}"
    print_request(method, url, body)
    try:
        if method == "GET":
            resp = requests.get(url, timeout=10)
        elif method == "POST":
            resp = requests.post(url, json=body, timeout=10)
        elif method == "PUT":
            resp = requests.put(url, json=body, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, timeout=10)
        else:
            raise ValueError(f"Unknown method: {method}")
        return print_response(resp, label, expect)
    except requests.exceptions.ConnectionError:
        global failed
        failed += 1
        print(f"  {C.RED}❌ CONNECTION REFUSED — is the server running at {BASE_URL}?{C.RESET}")
        return None


# ══════════════════════════════════════════════════════════
#  TEST SUITES
# ══════════════════════════════════════════════════════════

def test_health():
    banner("HEALTH CHECK")
    r = call("GET", "/health", "Health check", expect=200)
    r = call("GET", "/", "Root endpoint", expect=200)


# ── PRODUCTS ──────────────────────────────────────────────

def test_products():
    banner("PRODUCTS")

    # 1. Create product 1
    section("Create Product 1 (valid)")
    r = call("POST", "/api/v1/products/", "Create laptop", expect=201, body={
        "name": "Laptop Pro 15",
        "sku": "LAP-001",
        "description": "High performance laptop",
        "price": 1299.99,
        "stock_quantity": 50
    })
    if r and r.status_code == 201:
        state["product_id_1"] = r.json()["id"]

    # 2. Create product 2
    section("Create Product 2 (valid)")
    r = call("POST", "/api/v1/products/", "Create mouse", expect=201, body={
        "name": "Wireless Mouse",
        "sku": "MOU-002",
        "description": "Ergonomic wireless mouse",
        "price": 49.99,
        "stock_quantity": 200
    })
    if r and r.status_code == 201:
        state["product_id_2"] = r.json()["id"]

    # 3. Create product 3 (low stock)
    section("Create Product 3 (low stock for later test)")
    r = call("POST", "/api/v1/products/", "Create keyboard (low stock)", expect=201, body={
        "name": "Mechanical Keyboard",
        "sku": "KEY-003",
        "description": "Tactile mechanical keyboard",
        "price": 149.99,
        "stock_quantity": 5
    })
    if r and r.status_code == 201:
        state["product_id_3"] = r.json()["id"]

    # 4. Duplicate SKU → 409
    section("Create Product — Duplicate SKU (expect 409)")
    call("POST", "/api/v1/products/", "Duplicate SKU rejected", expect=409, body={
        "name": "Another Laptop",
        "sku": "LAP-001",
        "price": 999.99,
        "stock_quantity": 10
    })

    # 5. Invalid SKU format → 422
    section("Create Product — Invalid SKU format (expect 422)")
    call("POST", "/api/v1/products/", "Invalid SKU format rejected", expect=422, body={
        "name": "Bad Product",
        "sku": "SKU WITH SPACES!!",
        "price": 10.00,
        "stock_quantity": 10
    })

    # 6. Negative price → 422
    section("Create Product — Negative price (expect 422)")
    call("POST", "/api/v1/products/", "Negative price rejected", expect=422, body={
        "name": "Bad Product",
        "sku": "BAD-999",
        "price": -50.00,
        "stock_quantity": 10
    })

    # 7. List products
    section("List Products (paginated)")
    call("GET", "/api/v1/products/?skip=0&limit=10", "List all products", expect=200)

    # 8. Filter by name
    section("List Products — Filter by name")
    call("GET", "/api/v1/products/?name=laptop", "Filter by name=laptop", expect=200)

    # 9. Filter by SKU
    section("List Products — Filter by SKU")
    call("GET", "/api/v1/products/?sku=MOU", "Filter by sku=MOU", expect=200)

    # 10. Get single product
    section("Get Single Product")
    if state["product_id_1"]:
        call("GET", f"/api/v1/products/{state['product_id_1']}", "Get product by ID", expect=200)

    # 11. Get non-existent product → 404
    section("Get Product — Not Found (expect 404)")
    call("GET", "/api/v1/products/non-existent-id", "Product not found", expect=404)

    # 12. Update product
    section("Update Product")
    if state["product_id_1"]:
        call("PUT", f"/api/v1/products/{state['product_id_1']}", "Update laptop price", expect=200, body={
            "price": 1199.99,
            "description": "Updated: High performance laptop with discount"
        })

    # 13. Update SKU to duplicate → 409
    section("Update Product — SKU conflict (expect 409)")
    if state["product_id_2"]:
        call("PUT", f"/api/v1/products/{state['product_id_2']}", "SKU conflict on update", expect=409, body={
            "sku": "LAP-001"
        })


# ── CUSTOMERS ─────────────────────────────────────────────

def test_customers():
    banner("CUSTOMERS")

    # 1. Create customer 1
    section("Create Customer 1 (valid)")
    r = call("POST", "/api/v1/customers/", "Create customer Alice", expect=201, body={
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "phone": "9876543210",
        "address": "123 Main Street, New York, NY 10001"
    })
    if r and r.status_code == 201:
        state["customer_id_1"] = r.json()["id"]

    # 2. Create customer 2
    section("Create Customer 2 (valid)")
    r = call("POST", "/api/v1/customers/", "Create customer Bob", expect=201, body={
        "name": "Bob Smith",
        "email": "bob@example.com",
        "phone": "1234567890",
        "address": "456 Oak Avenue, Los Angeles, CA 90001"
    })
    if r and r.status_code == 201:
        state["customer_id_2"] = r.json()["id"]

    # 3. Duplicate email → 409
    section("Create Customer — Duplicate Email (expect 409)")
    call("POST", "/api/v1/customers/", "Duplicate email rejected", expect=409, body={
        "name": "Alice Clone",
        "email": "alice@example.com",
        "phone": "1111111111"
    })

    # 4. Invalid email → 422
    section("Create Customer — Invalid Email (expect 422)")
    call("POST", "/api/v1/customers/", "Invalid email rejected", expect=422, body={
        "name": "Bad User",
        "email": "not-an-email",
        "phone": "1234567890"
    })

    # 5. List customers
    section("List Customers (paginated)")
    call("GET", "/api/v1/customers/?skip=0&limit=10", "List all customers", expect=200)

    # 6. Filter by name
    section("List Customers — Filter by name")
    call("GET", "/api/v1/customers/?name=alice", "Filter by name=alice", expect=200)

    # 7. Get single customer
    section("Get Single Customer")
    if state["customer_id_1"]:
        call("GET", f"/api/v1/customers/{state['customer_id_1']}", "Get customer by ID", expect=200)

    # 8. Not found → 404
    section("Get Customer — Not Found (expect 404)")
    call("GET", "/api/v1/customers/fake-id-999", "Customer not found", expect=404)

    # 9. Update customer
    section("Update Customer")
    if state["customer_id_1"]:
        call("PUT", f"/api/v1/customers/{state['customer_id_1']}", "Update Alice address", expect=200, body={
            "address": "789 Updated Blvd, Chicago, IL 60601"
        })


# ── ORDERS ────────────────────────────────────────────────

def test_orders():
    banner("ORDERS")

    # 1. Create valid order
    section("Create Order 1 (valid — 2 items)")
    r = call("POST", "/api/v1/orders/", "Create order for Alice", expect=201, body={
        "customer_id": state["customer_id_1"],
        "items": [
            {"product_id": state["product_id_1"], "quantity": 2},
            {"product_id": state["product_id_2"], "quantity": 3},
        ],
        "notes": "Please gift wrap"
    })
    if r and r.status_code == 201:
        state["order_id_1"] = r.json()["id"]

    # 2. Create order 2
    section("Create Order 2 (valid — 1 item)")
    r = call("POST", "/api/v1/orders/", "Create order for Bob", expect=201, body={
        "customer_id": state["customer_id_2"],
        "items": [
            {"product_id": state["product_id_2"], "quantity": 1},
        ]
    })
    if r and r.status_code == 201:
        state["order_id_2"] = r.json()["id"]

    # 3. Insufficient stock → 400
    section("Create Order — Insufficient Stock (expect 400)")
    call("POST", "/api/v1/orders/", "Insufficient stock rejected", expect=400, body={
        "customer_id": state["customer_id_1"],
        "items": [
            {"product_id": state["product_id_1"], "quantity": 9999},
        ]
    })

    # 4. Invalid customer → 404
    section("Create Order — Invalid Customer (expect 404)")
    call("POST", "/api/v1/orders/", "Invalid customer rejected", expect=404, body={
        "customer_id": "fake-customer-id",
        "items": [
            {"product_id": state["product_id_1"], "quantity": 1},
        ]
    })

    # 5. Invalid product → 400
    section("Create Order — Invalid Product (expect 400)")
    call("POST", "/api/v1/orders/", "Invalid product rejected", expect=400, body={
        "customer_id": state["customer_id_1"],
        "items": [
            {"product_id": "fake-product-id", "quantity": 1},
        ]
    })

    # 6. Empty items → 422
    section("Create Order — Empty Items (expect 422)")
    call("POST", "/api/v1/orders/", "Empty items rejected", expect=422, body={
        "customer_id": state["customer_id_1"],
        "items": []
    })

    # 7. List orders
    section("List Orders (paginated)")
    call("GET", "/api/v1/orders/?skip=0&limit=10", "List all orders", expect=200)

    # 8. Filter by status
    section("List Orders — Filter by status=pending")
    call("GET", "/api/v1/orders/?status=pending", "Filter by status", expect=200)

    # 9. Filter by customer
    section("List Orders — Filter by customer_id")
    if state["customer_id_1"]:
        call("GET", f"/api/v1/orders/?customer_id={state['customer_id_1']}", "Filter by customer", expect=200)

    # 10. Get single order
    section("Get Single Order (with items)")
    if state["order_id_1"]:
        call("GET", f"/api/v1/orders/{state['order_id_1']}", "Get order with items", expect=200)

    # 11. Not found → 404
    section("Get Order — Not Found (expect 404)")
    call("GET", "/api/v1/orders/fake-order-id", "Order not found", expect=404)

    # 12. Valid status transition: pending → confirmed
    section("Update Order Status — pending → confirmed")
    if state["order_id_1"]:
        call("PUT", f"/api/v1/orders/{state['order_id_1']}/status", "Confirm order", expect=200, body={
            "status": "confirmed"
        })

    # 13. Valid status transition: confirmed → shipped
    section("Update Order Status — confirmed → shipped")
    if state["order_id_1"]:
        call("PUT", f"/api/v1/orders/{state['order_id_1']}/status", "Ship order", expect=200, body={
            "status": "shipped"
        })

    # 14. Invalid transition: shipped → pending → 400
    section("Update Order Status — Invalid Transition (expect 400)")
    if state["order_id_1"]:
        call("PUT", f"/api/v1/orders/{state['order_id_1']}/status", "Invalid transition rejected", expect=400, body={
            "status": "pending"
        })

    # 15. Cancel order 2 → stock should be restored
    section("Cancel Order 2 (stock should restore)")
    if state["order_id_2"]:
        call("DELETE", f"/api/v1/orders/{state['order_id_2']}", "Cancel order + restore stock", expect=204)

    # 16. Cancel already cancelled → 400
    section("Cancel Already Cancelled Order (expect 400/404)")
    if state["order_id_2"]:
        call("DELETE", f"/api/v1/orders/{state['order_id_2']}", "Already cancelled/deleted", expect=404)


# ── INVENTORY ─────────────────────────────────────────────

def test_inventory():
    banner("INVENTORY")

    # 1. List all inventory
    section("List All Inventory (paginated)")
    call("GET", "/api/v1/inventory/?skip=0&limit=10", "List inventory", expect=200)

    # 2. Low stock items
    section("Get Low Stock Items (threshold=10)")
    call("GET", "/api/v1/inventory/low-stock", "Low stock products", expect=200)

    # 3. Add stock
    section("Adjust Stock — ADD 100 units")
    if state["product_id_3"]:
        call("PUT", f"/api/v1/inventory/{state['product_id_3']}", "Add 100 units to keyboard", expect=200, body={
            "adjustment_type": "add",
            "quantity": 100,
            "reason": "New stock received from warehouse"
        })

    # 4. Subtract stock
    section("Adjust Stock — SUBTRACT 10 units")
    if state["product_id_3"]:
        call("PUT", f"/api/v1/inventory/{state['product_id_3']}", "Subtract 10 units", expect=200, body={
            "adjustment_type": "subtract",
            "quantity": 10,
            "reason": "Damaged goods removed"
        })

    # 5. Set stock to exact value
    section("Adjust Stock — SET to 75 units")
    if state["product_id_1"]:
        call("PUT", f"/api/v1/inventory/{state['product_id_1']}", "Set stock to 75", expect=200, body={
            "adjustment_type": "set",
            "quantity": 75,
            "reason": "Stock count correction after audit"
        })

    # 6. Subtract more than available → 400
    section("Adjust Stock — Subtract More Than Available (expect 400)")
    if state["product_id_2"]:
        call("PUT", f"/api/v1/inventory/{state['product_id_2']}", "Over-subtract rejected", expect=400, body={
            "adjustment_type": "subtract",
            "quantity": 99999,
            "reason": "Should fail"
        })

    # 7. Product not found → 404
    section("Adjust Stock — Product Not Found (expect 404)")
    call("PUT", "/api/v1/inventory/fake-product-id", "Product not found", expect=404, body={
        "adjustment_type": "add",
        "quantity": 10,
        "reason": "Should fail"
    })

    # 8. Verify stock was affected by order cancellation
    section("Verify Stock After Order Cancellation")
    if state["product_id_2"]:
        call("GET", f"/api/v1/products/{state['product_id_2']}", "Check mouse stock restored", expect=200)


# ── DELETE PROTECTION ─────────────────────────────────────

def test_delete_protection():
    banner("DELETE PROTECTION")

    # 1. Delete product with active order → 409
    section("Delete Product in Active Order (expect 409)")
    if state["product_id_1"]:
        call("DELETE", f"/api/v1/products/{state['product_id_1']}", "Product delete blocked", expect=409)

    # 2. Delete customer with active order → 409
    section("Delete Customer with Active Order (expect 409)")
    if state["customer_id_1"]:
        call("DELETE", f"/api/v1/customers/{state['customer_id_1']}", "Customer delete blocked", expect=409)

    # 3. Delete product with no orders → 204
    section("Delete Product with No Active Orders (expect 204)")
    if state["product_id_3"]:
        call("DELETE", f"/api/v1/products/{state['product_id_3']}", "Product deleted successfully", expect=204)

    # 4. Delete customer with no active orders → 204
    section("Delete Customer with No Active Orders (expect 204)")
    if state["customer_id_2"]:
        call("DELETE", f"/api/v1/customers/{state['customer_id_2']}", "Customer deleted successfully", expect=204)


# ══════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════

def print_summary():
    total = passed + failed
    banner("TEST SUMMARY")
    print(f"\n  Total Tests : {C.BOLD}{total}{C.RESET}")
    print(f"  {C.GREEN}Passed      : {passed}{C.RESET}")
    print(f"  {C.RED}Failed      : {failed}{C.RESET}")

    if failed == 0:
        print(f"\n  {C.BOLD}{C.GREEN}🎉 ALL TESTS PASSED!{C.RESET}\n")
    else:
        pct = int((passed / total) * 100) if total else 0
        print(f"\n  {C.BOLD}{C.YELLOW}⚠️  {pct}% passed ({failed} failed){C.RESET}\n")


# ══════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{C.BOLD}{C.WHITE}{'═' * 60}{C.RESET}")
    print(f"{C.BOLD}{C.WHITE}  Inventory & Order Management API — Test Suite{C.RESET}")
    print(f"{C.BOLD}{C.WHITE}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{C.RESET}")
    print(f"{C.BOLD}{C.WHITE}  Target: {BASE_URL}{C.RESET}")
    print(f"{C.BOLD}{C.WHITE}{'═' * 60}{C.RESET}")

    test_health()
    test_products()
    test_customers()
    test_orders()
    test_inventory()
    test_delete_protection()
    print_summary()
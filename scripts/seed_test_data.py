#!/usr/bin/env python3
"""Seed sample products, customers, and orders via the API."""

import json
import os
import sys
import urllib.error
import urllib.request

API_BASE = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")

PRODUCTS = [
    {
        "sku": "LAP-001",
        "name": "Pro Laptop 15",
        "description": "15-inch business laptop, 16GB RAM, 512GB SSD",
        "price": 899.99,
        "stock_quantity": 25,
    },
    {
        "sku": "MOU-002",
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with USB receiver",
        "price": 24.99,
        "stock_quantity": 150,
    },
    {
        "sku": "KEY-003",
        "name": "Mechanical Keyboard",
        "description": "RGB mechanical keyboard, blue switches",
        "price": 79.50,
        "stock_quantity": 40,
    },
    {
        "sku": "MON-004",
        "name": "27-inch Monitor",
        "description": "4K UHD IPS display, 60Hz",
        "price": 329.00,
        "stock_quantity": 18,
    },
    {
        "sku": "USB-005",
        "name": "USB-C Hub",
        "description": "7-in-1 USB-C hub with HDMI and SD card",
        "price": 45.00,
        "stock_quantity": 8,
    },
    {
        "sku": "HD-006",
        "name": "External HDD 2TB",
        "description": "Portable 2TB USB 3.0 hard drive",
        "price": 69.99,
        "stock_quantity": 35,
    },
]

CUSTOMERS = [
    {
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "phone": "+1-555-0101",
        "address": "120 Oak Street, Austin, TX 78701",
    },
    {
        "name": "Bob Martinez",
        "email": "bob.martinez@example.com",
        "phone": "+1-555-0102",
        "address": "45 Pine Avenue, Denver, CO 80202",
    },
    {
        "name": "Carol Chen",
        "email": "carol.chen@example.com",
        "phone": "+1-555-0103",
        "address": "88 Maple Drive, Seattle, WA 98101",
    },
    {
        "name": "David Okonkwo",
        "email": "david.okonkwo@example.com",
        "phone": "+1-555-0104",
        "address": "210 Cedar Lane, Chicago, IL 60601",
    },
]

# Orders reference products/customers by SKU and email after creation
ORDERS = [
    {
        "customer_email": "alice.johnson@example.com",
        "items": [
            {"sku": "LAP-001", "quantity": 1},
            {"sku": "MOU-002", "quantity": 2},
        ],
    },
    {
        "customer_email": "bob.martinez@example.com",
        "items": [
            {"sku": "MON-004", "quantity": 2},
            {"sku": "KEY-003", "quantity": 1},
        ],
    },
    {
        "customer_email": "carol.chen@example.com",
        "items": [
            {"sku": "USB-005", "quantity": 3},
            {"sku": "HD-006", "quantity": 1},
        ],
    },
    {
        "customer_email": "david.okonkwo@example.com",
        "items": [{"sku": "MOU-002", "quantity": 5}],
    },
]


def request(method: str, path: str, body: dict | None = None) -> dict | list | None:
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 204:
                return None
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        try:
            detail = json.loads(detail).get("detail", detail)
        except json.JSONDecodeError:
            pass
        raise RuntimeError(f"{method} {path} failed ({e.code}): {detail}") from e


def main() -> int:
    print(f"Seeding data at {API_BASE} ...\n")

    try:
        request("GET", "/health")
    except Exception as exc:
        print(f"Cannot reach API. Start the backend first.\n  {exc}")
        return 1

    sku_to_id: dict[str, int] = {}
    email_to_id: dict[str, int] = {}

    print("Products:")
    for p in PRODUCTS:
        try:
            created = request("POST", "/api/products", p)
            sku_to_id[p["sku"]] = created["id"]
            print(f"  + {p['sku']} — {p['name']} (stock: {p['stock_quantity']})")
        except RuntimeError as exc:
            if "already exists" in str(exc).lower() or "409" in str(exc):
                existing = request("GET", "/api/products")
                for row in existing:
                    if row["sku"] == p["sku"]:
                        sku_to_id[p["sku"]] = row["id"]
                print(f"  ~ {p['sku']} already exists, skipped")
            else:
                raise

    print("\nCustomers:")
    for c in CUSTOMERS:
        try:
            created = request("POST", "/api/customers", c)
            email_to_id[c["email"]] = created["id"]
            print(f"  + {c['email']} — {c['name']}")
        except RuntimeError as exc:
            if "already exists" in str(exc).lower() or "409" in str(exc):
                existing = request("GET", "/api/customers")
                for row in existing:
                    if row["email"] == c["email"]:
                        email_to_id[c["email"]] = row["id"]
                print(f"  ~ {c['email']} already exists, skipped")
            else:
                raise

    if not sku_to_id:
        products = request("GET", "/api/products")
        sku_to_id = {p["sku"]: p["id"] for p in products}
    if not email_to_id:
        customers = request("GET", "/api/customers")
        email_to_id = {c["email"]: c["id"] for c in customers}

    print("\nOrders:")
    for o in ORDERS:
        customer_id = email_to_id[o["customer_email"]]
        items = [
            {"product_id": sku_to_id[item["sku"]], "quantity": item["quantity"]}
            for item in o["items"]
        ]
        payload = {"customer_id": customer_id, "items": items}
        created = request("POST", "/api/orders", payload)
        total = created["total_amount"]
        print(f"  + Order #{created['id']} — {o['customer_email']} — total ${total}")

    print("\nDone. Open http://localhost:5173 to explore the data.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

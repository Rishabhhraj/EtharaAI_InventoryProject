# Test data for Inventory & Order Management

Use this guide to populate the app manually or run the automated seed script.

## Quick seed (recommended)

With the **API running** on port 8000:

```powershell
cd e:\EtharaAIProject\backend
.\.venv\Scripts\python.exe ..\scripts\seed_test_data.py
```

Or set a custom API URL:

```powershell
$env:API_URL = "http://localhost:8000"
python scripts\seed_test_data.py
```

---

## Products (6 items)

| SKU     | Name                 | Description                              | Price   | Stock |
|---------|----------------------|------------------------------------------|---------|-------|
| LAP-001 | Pro Laptop 15        | 15-inch business laptop, 16GB RAM, 512GB SSD | $899.99 | 25    |
| MOU-002 | Wireless Mouse       | Ergonomic wireless mouse with USB receiver | $24.99  | 150   |
| KEY-003 | Mechanical Keyboard  | RGB mechanical keyboard, blue switches   | $79.50  | 40    |
| MON-004 | 27-inch Monitor      | 4K UHD IPS display, 60Hz                 | $329.00 | 18    |
| USB-005 | USB-C Hub            | 7-in-1 USB-C hub with HDMI and SD card   | $45.00  | 8     |
| HD-006  | External HDD 2TB     | Portable 2TB USB 3.0 hard drive            | $69.99  | 35    |

**Low-stock alert:** `USB-005` has only **8** units (shows as low stock on Inventory page, threshold ≤10).

---

## Customers (4 items)

| Name           | Email                      | Phone        | Address                                      |
|----------------|----------------------------|--------------|----------------------------------------------|
| Alice Johnson  | alice.johnson@example.com  | +1-555-0101  | 120 Oak Street, Austin, TX 78701             |
| Bob Martinez   | bob.martinez@example.com   | +1-555-0102  | 45 Pine Avenue, Denver, CO 80202             |
| Carol Chen     | carol.chen@example.com     | +1-555-0103  | 88 Maple Drive, Seattle, WA 98101            |
| David Okonkwo  | david.okonkwo@example.com  | +1-555-0104  | 210 Cedar Lane, Chicago, IL 60601            |

---

## Sample orders (after products & customers exist)

### Order 1 — Alice Johnson
| Product (SKU) | Qty |
|---------------|-----|
| LAP-001       | 1   |
| MOU-002       | 2   |

**Expected total:** $899.99 + (2 × $24.99) = **$949.97**  
**Stock after:** LAP-001 → 24, MOU-002 → 148

### Order 2 — Bob Martinez
| Product (SKU) | Qty |
|---------------|-----|
| MON-004       | 2   |
| KEY-003       | 1   |

**Expected total:** (2 × $329.00) + $79.50 = **$737.50**  
**Stock after:** MON-004 → 16, KEY-003 → 39

### Order 3 — Carol Chen
| Product (SKU) | Qty |
|---------------|-----|
| USB-005       | 3   |
| HD-006        | 1   |

**Expected total:** (3 × $45.00) + $69.99 = **$204.99**  
**Stock after:** USB-005 → 5 (low stock), HD-006 → 34

### Order 4 — David Okonkwo
| Product (SKU) | Qty |
|---------------|-----|
| MOU-002       | 5   |

**Expected total:** 5 × $24.99 = **$124.95**  
**Stock after:** MOU-002 → 143

---

## Scenarios to test manually

### 1. Unique SKU (should fail)
Try creating a second product with SKU `LAP-001` → **409 Conflict**.

### 2. Unique email (should fail)
Try creating a customer with `alice.johnson@example.com` again → **409 Conflict**.

### 3. Insufficient stock (should fail)
After seeding, place an order for **USB-005** with quantity **20** (only 5–8 left depending on prior orders) → **400** with insufficient stock message; stock unchanged.

### 4. Inventory dashboard
Open **Inventory** — `USB-005` should show **Low stock** badge after Order 3.

### 5. Duplicate product on one order
Same product twice in one order line list → API rejects duplicate product IDs (combine quantities into one line).

---

## API examples (curl / PowerShell)

**Create product:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/products" -Method POST -ContentType "application/json" -Body (@{
  sku = "LAP-001"; name = "Pro Laptop 15"; description = "15-inch laptop"
  price = 899.99; stock_quantity = 25
} | ConvertTo-Json)
```

**Place order:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/orders" -Method POST -ContentType "application/json" -Body (@{
  customer_id = 1
  items = @(
    @{ product_id = 1; quantity = 1 }
    @{ product_id = 2; quantity = 2 }
  )
} | ConvertTo-Json -Depth 5)
```

Replace `customer_id` and `product_id` with IDs from your database after creating records.

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { InventoryItem } from "../types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<InventoryItem[]>("/api/inventory")
      .then(setItems)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lowStockCount = items.filter((i) => i.low_stock).length;

  return (
    <div>
      <header className="page-header">
        <h1>Inventory</h1>
        <p>Real-time stock levels across all products</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Total SKUs</div>
          <div className="value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low stock (≤10)</div>
          <div className="value" style={{ color: lowStockCount ? "var(--warning)" : undefined }}>
            {lowStockCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Total units in stock</div>
          <div className="value">{items.reduce((s, i) => s + i.stock_quantity, 0)}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : items.length === 0 ? (
          <p className="empty-state">No inventory data. Add products first.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td>
                      <code>{item.sku}</code>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.stock_quantity}</td>
                    <td>
                      {item.low_stock ? (
                        <span className="badge badge-warning">Low stock</span>
                      ) : (
                        <span className="badge badge-success">In stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

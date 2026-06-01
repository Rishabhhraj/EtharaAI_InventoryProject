import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Customer, InventoryItem, Order, Product } from "../types";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Product[]>("/api/products"),
      api.get<Customer[]>("/api/customers"),
      api.get<Order[]>("/api/orders?limit=5"),
      api.get<InventoryItem[]>("/api/inventory"),
    ])
      .then(([p, c, o, i]) => {
        setProducts(p);
        setCustomers(c);
        setOrders(o);
        setInventory(i);
      })
      .finally(() => setLoading(false));
  }, []);

  const lowStock = inventory.filter((i) => i.low_stock).length;

  if (loading) {
    return (
      <div>
        <header className="page-header">
          <h1>Dashboard</h1>
        </header>
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of products, customers, orders, and inventory</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Products</div>
          <div className="value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Customers</div>
          <div className="value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Recent orders</div>
          <div className="value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low stock items</div>
          <div className="value" style={{ color: lowStock ? "var(--warning)" : undefined }}>
            {lowStock}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent orders</h2>
          <Link to="/orders" className="btn btn-secondary btn-sm">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="empty-state">No orders yet. <Link to="/orders">Place an order</Link></p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-success">{o.status}</span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
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

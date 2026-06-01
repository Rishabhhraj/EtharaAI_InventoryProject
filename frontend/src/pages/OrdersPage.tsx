import { FormEvent, Fragment, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import Modal from "../components/Modal";
import type { Customer, Order, Product } from "../types";

interface LineDraft {
  product_id: string;
  quantity: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ product_id: "", quantity: "1" }]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Order[]>("/api/orders"),
      api.get<Product[]>("/api/products"),
      api.get<Customer[]>("/api/customers"),
    ])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setCustomers(c);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setCustomerId(customers[0] ? String(customers[0].id) : "");
    setLines([{ product_id: products[0] ? String(products[0].id) : "", quantity: "1" }]);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const addLine = () => {
    setLines([...lines, { product_id: "", quantity: "1" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof LineDraft, value: string) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const items = lines
      .filter((l) => l.product_id && parseInt(l.quantity, 10) > 0)
      .map((l) => ({
        product_id: parseInt(l.product_id, 10),
        quantity: parseInt(l.quantity, 10),
      }));

    if (!customerId || items.length === 0) {
      setError("Select a customer and at least one product line.");
      setSaving(false);
      return;
    }

    try {
      const order = await api.post<Order>("/api/orders", {
        customer_id: parseInt(customerId, 10),
        items,
      });
      setModalOpen(false);
      setSuccess(`Order #${order.id} placed successfully. Stock has been reduced.`);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to place order. Check stock availability."
      );
    } finally {
      setSaving(false);
    }
  };

  const getProductStock = (productId: string) => {
    const p = products.find((x) => x.id === parseInt(productId, 10));
    return p?.stock_quantity;
  };

  return (
    <div>
      <header className="page-header">
        <h1>Orders</h1>
        <p>Place orders with automatic inventory deduction and stock validation</p>
      </header>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="toolbar">
        <span style={{ color: "var(--text-muted)" }}>{orders.length} orders</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={customers.length === 0 || products.length === 0}
        >
          Place order
        </button>
      </div>

      {(customers.length === 0 || products.length === 0) && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Add at least one customer and one product before placing orders.
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="empty-state">No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <Fragment key={o.id}>
                    <tr>
                      <td>#{o.id}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.items.length}</td>
                      <td>${Number(o.total_amount).toFixed(2)}</td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setExpandedId(expandedId === o.id ? null : o.id)
                          }
                        >
                          {expandedId === o.id ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr>
                        <td colSpan={6}>
                          <table>
                            <thead>
                              <tr>
                                <th>SKU</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Line total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <code>{item.product_sku}</code>
                                  </td>
                                  <td>{item.product_name}</td>
                                  <td>{item.quantity}</td>
                                  <td>${Number(item.unit_price).toFixed(2)}</td>
                                  <td>${Number(item.line_total).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title="Place order" onClose={() => setModalOpen(false)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ marginBottom: "1rem" }}>
              <label>
                Customer
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Order lines</p>
            {lines.map((line, index) => {
              const stock = getProductStock(line.product_id);
              return (
                <div key={index} className="order-line">
                  <label>
                    Product
                    <select
                      required
                      value={line.product_id}
                      onChange={(e) => updateLine(index, "product_id", e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — stock: {p.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Qty
                    <input
                      required
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, "quantity", e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 1}
                    title="Remove line"
                  >
                    ×
                  </button>
                  {line.product_id && stock !== undefined && (
                    <small
                      style={{
                        gridColumn: "1 / -1",
                        color:
                          parseInt(line.quantity, 10) > stock
                            ? "var(--danger)"
                            : "var(--text-muted)",
                      }}
                    >
                      Available stock: {stock}
                      {parseInt(line.quantity, 10) > stock && " — insufficient!"}
                    </small>
                  )}
                </div>
              );
            })}

            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
              + Add line
            </button>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Placing…" : "Place order"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

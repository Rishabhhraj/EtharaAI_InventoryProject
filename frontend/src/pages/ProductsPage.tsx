import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import Modal from "../components/Modal";
import type { Product } from "../types";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Product[]>("/api/products")
      .then(setProducts)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      stock_quantity: String(p.stock_quantity),
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.patch(`/api/products/${editing.id}`, {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          stock_quantity: parseInt(form.stock_quantity, 10),
        });
      } else {
        await api.post("/api/products", {
          sku: form.sku,
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          stock_quantity: parseInt(form.stock_quantity, 10),
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>Products</h1>
        <p>Manage catalog with unique SKUs and stock levels</p>
      </header>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span style={{ color: "var(--text-muted)" }}>{products.length} products</span>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : products.length === 0 ? (
          <p className="empty-state">No products yet. Add your first product.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code>{p.sku}</code>
                    </td>
                    <td>{p.name}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.stock_quantity <= 10 ? "badge-warning" : "badge-success"
                        }`}
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit product" : "Add product"} onClose={() => setModalOpen(false)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            {!editing && (
              <label>
                SKU (unique)
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. WIDGET-001"
                />
              </label>
            )}
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label>
              Price
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              Stock quantity
              <input
                required
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
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

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import Modal from "../components/Modal";
import type { Customer } from "../types";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Customer[]>("/api/customers")
      .then(setCustomers)
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

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      address: c.address ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
      };
      if (editing) {
        await api.patch(`/api/customers/${editing.id}`, payload);
      } else {
        await api.post("/api/customers", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>Customers</h1>
        <p>Manage customers with unique email addresses</p>
      </header>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span style={{ color: "var(--text-muted)" }}>{customers.length} customers</span>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add customer
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="empty-state">No customers yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone ?? "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c.id)}
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
        <Modal
          title={editing ? "Edit customer" : "Add customer"}
          onClose={() => setModalOpen(false)}
        >
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Email (unique)
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Address
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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

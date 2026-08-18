"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { api, ApiError, type Order, type NewOrderInput } from "../../../lib/api";
import {
  PageHeader,
  Card,
  Spinner,
  ErrorBanner,
  EmptyState,
  Button,
  Modal,
  Field,
  inputClass,
} from "../../components/ui";
import { IconPlus, IconEdit, IconTrash } from "../../components/icons";

const STATUS_OPTIONS = ["pending", "assigned", "in_progress", "delivered", "cancelled"];
const PRIORITY_OPTIONS = ["low", "normal", "high"];

// "lat,lng" — e.g. 31.52,74.35. Accepts an optional leading minus and decimals on each half.
const COORDINATES_PATTERN = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;
// "HH:MM-HH:MM" 24h — e.g. 10:00-12:00.
const TIME_WINDOW_PATTERN = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

const emptyForm: Omit<NewOrderInput, "vendor_id"> = {
  customer_name: "",
  address: "",
  coordinates: "",
  time_window: "",
  priority: "normal",
  weight: 1,
  notes: "",
  status: "pending",
};

/** Coordinates are required for routing, so they get a range check beyond the regex; everything
 *  else here is enforced by the input elements themselves (required/pattern/min/max). */
function validateOrderForm(form: Omit<NewOrderInput, "vendor_id">): string | null {
  const [latStr, lngStr] = form.coordinates.split(",");
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return "Coordinates must be a valid \"lat,lng\" pair (latitude -90 to 90, longitude -180 to 180).";
  }
  return null;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${o.customer_name ?? ""} ORD-${o.id} ${o.address ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  function openCreate() {
    setFormError("");
    setEditingOrder(null);
    setForm(emptyForm);
    setShowAdd(true);
  }

  function openEdit(order: Order) {
    setFormError("");
    setEditingOrder(order);
    setForm({
      customer_name: order.customer_name ?? "",
      address: order.address ?? "",
      coordinates: order.coordinates ?? "",
      time_window: order.time_window ?? "",
      priority: order.priority ?? "normal",
      weight: order.weight ?? 1,
      notes: order.notes ?? "",
      status: order.status,
    });
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const validationError = validateOrderForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    try {
      if (editingOrder === null) {
        if (!user?.vendor_id) {
          setFormError("Your account has no vendor associated with it.");
          setSaving(false);
          return;
        }
        const created = await api.createOrder({ ...form, vendor_id: user.vendor_id, weight: Number(form.weight) });
        setOrders((prev) => [created, ...prev]);
      } else {
        const updated = await api.updateOrder(editingOrder.id, {
          ...form,
          vendor_id: editingOrder.vendor_id ?? user?.vendor_id ?? 0,
          weight: Number(form.weight),
        });
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
      setShowAdd(false);
      setEditingOrder(null);
      setForm(emptyForm);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save order");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(order: Order, status: string) {
    setBusyId(order.id);
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      await api.updateOrderStatus(order.id, status);
    } catch (err) {
      setOrders(previous);
      setError(err instanceof Error ? err.message : "Could not update order status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(order: Order) {
    setBusyId(order.id);
    try {
      await api.deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete order");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations / Orders"
        title="Orders"
        description="Manage customer deliveries and prepare stops for route planning."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <IconPlus width={16} height={16} /> Add order
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, order ID or address"
          className={`${inputClass} max-w-xs`}
        />
        <span className="ml-auto text-xs text-text-faint">
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-7 w-7" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No orders match"
          description="Try a different filter, or add your first order to get started."
          action={
            <Button variant="ghost" onClick={openCreate}>
              <IconPlus width={16} height={16} /> Add order
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-text-faint">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover/60">
                  <td className="px-4 py-3 font-data text-xs text-text-muted">ORD-{o.id}</td>
                  <td className="px-4 py-3 font-medium text-text">{o.customer_name}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-text-muted">{o.address}</td>
                  <td className="px-4 py-3 font-data text-xs text-text-muted">{o.time_window || "—"}</td>
                  <td className="px-4 py-3 capitalize text-text-muted">{o.priority || "normal"}</td>
                  <td className="px-4 py-3 text-text-muted">{o.weight ?? "—"} kg</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      disabled={busyId === o.id}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      className="rounded-md border border-border-strong bg-surface px-2 py-1 font-data text-[11px] uppercase tracking-wide text-text outline-none focus:border-beacon"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(o)}
                        aria-label={`Edit order ORD-${o.id}`}
                        className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-hover hover:text-text"
                      >
                        <IconEdit width={16} height={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(o)}
                        disabled={busyId === o.id}
                        aria-label={`Delete order ORD-${o.id}`}
                        className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-alert-soft hover:text-alert disabled:opacity-40"
                      >
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {showAdd && (
        <Modal title={editingOrder === null ? "Add order" : `Edit order ORD-${editingOrder.id}`} onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <ErrorBanner message={formError} />}
            <Field label="Customer name" required>
              <input
                required
                minLength={2}
                maxLength={120}
                className={inputClass}
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Ayesha Raza"
              />
            </Field>
            <Field label="Address" required>
              <input
                required
                minLength={5}
                maxLength={255}
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="14 Johar Town, Lahore"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Coordinates" required>
                <input
                  required
                  pattern={COORDINATES_PATTERN.source}
                  title="lat,lng — e.g. 31.52,74.35"
                  className={inputClass}
                  value={form.coordinates}
                  onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
                  placeholder="31.52,74.35"
                />
              </Field>
              <Field label="Time window">
                <input
                  pattern={TIME_WINDOW_PATTERN.source}
                  title="HH:MM-HH:MM — e.g. 10:00-12:00"
                  className={inputClass}
                  value={form.time_window}
                  onChange={(e) => setForm({ ...form, time_window: e.target.value })}
                  placeholder="10:00-12:00 (optional)"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select
                  className={inputClass}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Weight (kg)" required>
                <input
                  required
                  type="number"
                  min={0.1}
                  max={5000}
                  step="0.1"
                  className={inputClass}
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                />
              </Field>
            </div>
            {editingOrder !== null && (
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Notes">
              <textarea
                maxLength={500}
                className={`${inputClass} min-h-[70px] resize-y`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional delivery notes"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? <Spinner className="h-4 w-4" /> : editingOrder === null ? "Add order" : "Save changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

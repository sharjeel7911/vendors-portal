"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { api, ApiError, type Vehicle, type NewVehicleInput } from "../../../lib/api";
import { PageHeader, Card, StatusBadge, Spinner, ErrorBanner, EmptyState, Button, Modal, Field, inputClass } from "../../components/ui";
import { IconTruck, IconPlus, IconEdit, IconTrash } from "../../components/icons";

const STATUS_OPTIONS = ["AVAILABLE", "IN_USE", "MAINTENANCE"];
const TYPE_OPTIONS = ["VAN", "TRUCK", "BIKE", "CAR"];

// e.g. LEA-4521 — letters, digits, spaces and dashes only.
const PLATE_PATTERN = /^[A-Za-z0-9- ]{2,20}$/;

const emptyForm: NewVehicleInput = {
  vendor_id: 0,
  type: "",
  capacity: 1,
  depot: "",
  plate_no: "",
  status: "AVAILABLE",
};

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRawId, setEditingRawId] = useState<number | null>(null);
  const [form, setForm] = useState<NewVehicleInput>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getVehicles();
      setVehicles(res.vehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    api
      .getVehicles()
      .then((res) => !cancelled && setVehicles(res.vehicles))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load vehicles"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (statusFilter === "all" ? vehicles : vehicles.filter((v) => v.status === statusFilter)),
    [vehicles, statusFilter],
  );

  const statuses = useMemo(() => Array.from(new Set(vehicles.map((v) => v.status))), [vehicles]);

  // Keep whatever value an existing record already has selectable, even if it predates
  // this fixed list, so editing a vehicle never silently rewrites its type.
  const typeOptions = useMemo(
    () => (form.type && !TYPE_OPTIONS.includes(form.type) ? [form.type, ...TYPE_OPTIONS] : TYPE_OPTIONS),
    [form.type],
  );

  function openCreate() {
    setFormError("");
    setEditingRawId(null);
    setForm({ ...emptyForm, vendor_id: user?.vendor_id ?? 0 });
    setShowForm(true);
  }

  async function openEdit(vehicle: Vehicle) {
    setFormError("");
    setEditingRawId(vehicle.rawId);
    setShowForm(true);
    setFormLoading(true);
    try {
      const detail = await api.getVehicleDetail(vehicle.rawId);
      setForm({
        vendor_id: detail.vendor_id,
        type: detail.type,
        capacity: detail.capacity,
        depot: detail.depot,
        plate_no: detail.plate_no,
        status: detail.status,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to load vehicle");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingRawId === null) {
        await api.createVehicle({ ...form, vendor_id: user?.vendor_id ?? form.vendor_id });
      } else {
        // vendor_id is fixed at creation — the backend's update endpoint doesn't accept it.
        const { vendor_id: _vendor_id, ...rest } = form;
        void _vendor_id;
        await api.updateVehicle(editingRawId, rest);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save vehicle");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    if (!window.confirm(`Remove ${vehicle.vehicleNumber} from the fleet?`)) return;
    setBusyId(vehicle.rawId);
    try {
      await api.deleteVehicle(vehicle.rawId);
      setVehicles((prev) => prev.filter((v) => v.rawId !== vehicle.rawId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete vehicle");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet / Vehicles"
        title="Vehicles"
        description="Vans and trucks available for dispatch."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <IconPlus width={16} height={16} /> Add vehicle
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-text-faint">
          {filtered.length} of {vehicles.length} vehicles
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
          title="No vehicles found"
          description="Vehicles you add to your fleet will show up here."
          action={
            <Button variant="ghost" onClick={openCreate}>
              <IconPlus width={16} height={16} /> Add vehicle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-soft text-info">
                    <IconTruck width={18} height={18} />
                  </div>
                  <div>
                    <div className="font-data text-sm font-semibold text-text">{v.vehicleNumber}</div>
                    <div className="text-xs capitalize text-text-faint">{v.type.toLowerCase()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(v)}
                    aria-label={`Edit ${v.vehicleNumber}`}
                    className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <IconEdit width={15} height={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(v)}
                    disabled={busyId === v.rawId}
                    aria-label={`Delete ${v.vehicleNumber}`}
                    className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-alert-soft hover:text-alert disabled:opacity-40"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-faint">
                <span>Capacity</span>
                <span className="font-data text-text-muted">{v.capacity} kg</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-text-faint">
                <span>Driver</span>
                <span className="font-data text-text-muted">{v.driverId ?? "Unassigned"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingRawId === null ? "Add vehicle" : "Edit vehicle"} onClose={() => setShowForm(false)}>
          {formLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <ErrorBanner message={formError} />}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plate no." required>
                  <input
                    required
                    pattern={PLATE_PATTERN.source}
                    title="2-20 letters, digits, spaces or dashes — e.g. LEA-4521"
                    className={inputClass}
                    value={form.plate_no}
                    onChange={(e) => setForm({ ...form, plate_no: e.target.value.toUpperCase() })}
                    placeholder="LEA-4521"
                  />
                </Field>
                <Field label="Type" required>
                  <select
                    required
                    className={inputClass}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="" disabled>
                      Select a type…
                    </option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity (kg)" required>
                  <input
                    required
                    type="number"
                    min={1}
                    max={50000}
                    className={inputClass}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Depot" required>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    className={inputClass}
                    value={form.depot}
                    onChange={(e) => setForm({ ...form, depot: e.target.value })}
                    placeholder="Johar Town depot"
                  />
                </Field>
              </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : editingRawId === null ? "Add vehicle" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

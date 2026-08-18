"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { api, ApiError, type Driver, type Vehicle, type NewDriverInput } from "../../../lib/api";
import { PageHeader, Card, StatusBadge, Spinner, ErrorBanner, EmptyState, Button, Modal, Field, inputClass } from "../../components/ui";
import { IconDriver, IconPlus, IconEdit, IconTrash } from "../../components/icons";

const STATUS_OPTIONS = ["AVAILABLE", "IN_USE", "OFFLINE"];

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
// e.g. LHR-12345 — letters, digits and dashes only.
const LICENSE_PATTERN = /^[A-Za-z0-9-]{3,30}$/;
// "HH:MM-HH:MM" 24h — e.g. 09:00-18:00.
const WORKING_HOURS_PATTERN = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

const emptyForm: NewDriverInput = {
  vendor_id: 0,
  name: "",
  phone: "",
  liscence_no: "",
  working_hours: "",
  status: "AVAILABLE",
  latitude: 0,
  longitude: 0,
  vehicle_id: null,
};

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRawId, setEditingRawId] = useState<number | null>(null);
  const [form, setForm] = useState<NewDriverInput>(emptyForm);
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getDrivers();
      setDrivers(res.drivers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    api
      .getDrivers()
      .then((res) => !cancelled && setDrivers(res.drivers))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load drivers"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (statusFilter === "all" ? drivers : drivers.filter((d) => d.status === statusFilter)),
    [drivers, statusFilter],
  );

  const statuses = useMemo(() => Array.from(new Set(drivers.map((d) => d.status))), [drivers]);

  async function openCreate() {
    setFormError("");
    setEditingRawId(null);
    setForm({ ...emptyForm, vendor_id: user?.vendor_id ?? 0 });
    setShowForm(true);
    setFormLoading(true);
    try {
      const { vehicles } = await api.getVehicles();
      setVehicleOptions(vehicles);
    } catch {
      // Vehicle assignment is optional — a failed lookup shouldn't block the form.
    } finally {
      setFormLoading(false);
    }
  }

  async function openEdit(driver: Driver) {
    setFormError("");
    setEditingRawId(driver.rawId);
    setShowForm(true);
    setFormLoading(true);
    try {
      const [detail, { vehicles }] = await Promise.all([api.getDriverDetail(driver.rawId), api.getVehicles()]);
      setForm({
        vendor_id: detail.vendor_id,
        name: detail.name,
        phone: detail.phone,
        liscence_no: detail.liscence_no,
        working_hours: detail.working_hours,
        status: detail.status,
        latitude: detail.latitude,
        longitude: detail.longitude,
        vehicle_id: detail.vehicle_id,
      });
      setVehicleOptions(vehicles);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to load driver");
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
        await api.createDriver({ ...form, vendor_id: user?.vendor_id ?? form.vendor_id });
      } else {
        // vendor_id is fixed at creation — the backend's update endpoint doesn't accept it.
        const { vendor_id: _vendor_id, ...rest } = form;
        void _vendor_id;
        await api.updateDriver(editingRawId, rest);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save driver");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(driver: Driver) {
    if (!window.confirm(`Remove ${driver.name} from the roster?`)) return;
    setBusyId(driver.rawId);
    try {
      await api.deleteDriver(driver.rawId);
      setDrivers((prev) => prev.filter((d) => d.rawId !== driver.rawId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete driver");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet / Drivers"
        title="Drivers"
        description="Everyone currently on your roster."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <IconPlus width={16} height={16} /> Add driver
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
          {filtered.length} of {drivers.length} drivers
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
          title="No drivers found"
          description="Drivers you add to your fleet will show up here."
          action={
            <Button variant="ghost" onClick={openCreate}>
              <IconPlus width={16} height={16} /> Add driver
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-beacon-soft text-beacon-strong">
                    <IconDriver width={18} height={18} />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-text">{d.name}</div>
                    <div className="font-data text-xs text-text-faint">{d.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(d)}
                    aria-label={`Edit ${d.name}`}
                    className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <IconEdit width={15} height={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={busyId === d.rawId}
                    aria-label={`Delete ${d.name}`}
                    className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-alert-soft hover:text-alert disabled:opacity-40"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-faint">
                <span>Current route</span>
                <span className="font-data text-text-muted">{d.currentRouteId ?? "None"}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-text-faint">
                <span>Position</span>
                <span className="font-data text-text-muted">
                  {d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingRawId === null ? "Add driver" : "Edit driver"} onClose={() => setShowForm(false)}>
          {formLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <ErrorBanner message={formError} />}
              <Field label="Name" required>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bilal Ahmed"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" required>
                  <input
                    required
                    pattern={PHONE_PATTERN.source}
                    title="7-20 digits, spaces, +, - or () — e.g. +92 300 1234567"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                  />
                </Field>
                <Field label="License no." required>
                  <input
                    required
                    pattern={LICENSE_PATTERN.source}
                    title="3-30 letters, digits or dashes — e.g. LHR-12345"
                    className={inputClass}
                    value={form.liscence_no}
                    onChange={(e) => setForm({ ...form, liscence_no: e.target.value })}
                    placeholder="LHR-12345"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Working hours" required>
                  <input
                    required
                    pattern={WORKING_HOURS_PATTERN.source}
                    title="HH:MM-HH:MM — e.g. 09:00-18:00"
                    className={inputClass}
                    value={form.working_hours}
                    onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
                    placeholder="09:00-18:00"
                  />
                </Field>
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" required>
                  <input
                    required
                    type="number"
                    min={-90}
                    max={90}
                    step="any"
                    className={inputClass}
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Longitude" required>
                  <input
                    required
                    type="number"
                    min={-180}
                    max={180}
                    step="any"
                    className={inputClass}
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Vehicle">
                <select
                  className={inputClass}
                  value={form.vehicle_id ?? ""}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Unassigned</option>
                  {vehicleOptions.map((v) => (
                    <option key={v.rawId} value={v.rawId}>
                      {v.vehicleNumber}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : editingRawId === null ? "Add driver" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

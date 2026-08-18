"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, type RouteListItem, type Driver, type Vehicle } from "../../../lib/api";
import {
  PageHeader,
  Card,
  StatusBadge,
  Spinner,
  ErrorBanner,
  EmptyState,
  Button,
  Modal,
  Field,
  inputClass,
} from "../../components/ui";
import { IconPlus, IconBolt, IconPin, IconRoute as IconRouteMark } from "../../components/icons";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getRoutes();
      setRoutes(res.routes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    api
      .getRoutes()
      .then((res) => {
        if (!cancelled) setRoutes(res.routes);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load routes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleOptimize() {
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const res = await api.optimizeRoutes();
      setOptimizeResult(
        `Optimized ${res.routesCreated} routes — distance down ${res.distanceReductionPercent}%, time down ${res.estimatedTimeReductionPercent}%.`,
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run optimization");
    } finally {
      setOptimizing(false);
    }
  }

  const totalStops = routes.reduce((sum, r) => sum + r.totalStops, 0);
  const totalDistance = routes.reduce((sum, r) => sum + r.distanceKm, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Operations / Routes"
        title="Routes"
        description="Review, refine and dispatch delivery routes."
        actions={
          <>
            <Button variant="ghost" onClick={handleOptimize} disabled={optimizing}>
              {optimizing ? <Spinner className="h-4 w-4" /> : <IconBolt width={16} height={16} />}
              Optimize routes
            </Button>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <IconPlus width={16} height={16} /> Create route
            </Button>
          </>
        }
      />

      {optimizeResult && (
        <div className="mb-4 rounded-lg border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-signal">
          {optimizeResult}
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryChip label="Routes" value={routes.length} />
        <SummaryChip label="Stops" value={totalStops} />
        <SummaryChip label="Distance" value={`${totalDistance} km`} />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-7 w-7" />
        </div>
      ) : routes.length === 0 ? (
        <EmptyState
          title="No routes planned"
          description="Create a route from your pending orders to get moving."
          action={
            <Button variant="ghost" onClick={() => setShowCreate(true)}>
              <IconPlus width={16} height={16} /> Create route
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routes.map((r) => (
            <Link key={r.id} href={`/dashboard/routes/${r.id}`}>
              <Card className="h-full p-5 transition-colors hover:border-border-strong hover:bg-surface-hover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-data text-[11px] tracking-[0.1em] text-text-faint">ROUTE #{r.id}</div>
                    <div className="mt-1 font-display text-lg font-semibold text-text">
                      {r.driver?.name ?? "Unassigned"}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <InfoLine icon={<IconRouteMark width={14} height={14} />} label={r.vehicle?.name ?? "No vehicle"} />
                  <InfoLine icon={<IconPin width={14} height={14} />} label={`${r.totalStops} stops`} />
                  <InfoLine icon={<IconBolt width={14} height={14} />} label={`${r.distanceKm} km`} />
                  <InfoLine label={`${r.durationMinutes} min`} />
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-signal"
                      style={{ width: `${r.totalStops ? Math.round((r.completedStops / r.totalStops) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] text-text-faint">
                    {r.completedStops} of {r.totalStops} stops complete
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRouteModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-faint">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-text">{value}</div>
    </Card>
  );
}

function InfoLine({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-text-muted">
      {icon && <span className="text-text-faint">{icon}</span>}
      {label}
    </div>
  );
}

function CreateRouteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<{ id: string; orderId: string; address: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      try {
        const [driversRes, vehiclesRes, stopsRes] = await Promise.all([
          api.getDrivers("AVAILABLE"),
          api.getVehicles("AVAILABLE"),
          api.getStops("pending"),
        ]);
        if (cancelled) return;
        setDrivers(driversRes.drivers);
        setVehicles(vehiclesRes.vehicles);
        setStops(stopsRes.stops);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load options");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStop(id: string) {
    setStopIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (stopIds.length === 0) {
      setError("Select at least one stop.");
      return;
    }
    setSaving(true);
    try {
      await api.createRoute({
        date,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        stopIds,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create route");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create route" onClose={onClose}>
      {loadingOptions ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <Field label="Date" required>
            <input
              required
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Driver">
              <select className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle">
              <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={`Stops (${stopIds.length} selected)`} required>
            <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-border-strong bg-surface p-2">
              {stops.length === 0 ? (
                <p className="px-2 py-3 text-sm text-text-faint">No pending stops available.</p>
              ) : (
                stops.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-hover"
                  >
                    <input
                      type="checkbox"
                      checked={stopIds.includes(s.id)}
                      onChange={() => toggleStop(s.id)}
                      className="h-4 w-4 accent-[var(--color-beacon)]"
                    />
                    <span className="font-data text-xs text-text-faint">{s.orderId}</span>
                    <span className="truncate text-text-muted">{s.address}</span>
                  </label>
                ))
              )}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Create route"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError, type RouteDetail, type Driver, type Vehicle } from "../../../../lib/api";
import { Card, StatusBadge, Spinner, ErrorBanner, Button, SequenceStamp, inputClass } from "../../../components/ui";
import { IconChevronLeft, IconBolt } from "../../../components/icons";

const ROUTE_STATUSES = ["PLANNED", "READY", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [routeRes, driversRes, vehiclesRes] = await Promise.all([
        api.getRoute(routeId),
        api.getDrivers("AVAILABLE"),
        api.getVehicles("AVAILABLE"),
      ]);
      setRoute(routeRes);
      setDrivers(driversRes.drivers);
      setVehicles(vehiclesRes.vehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load route");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getRoute(routeId), api.getDrivers("AVAILABLE"), api.getVehicles("AVAILABLE")])
      .then(([routeRes, driversRes, vehiclesRes]) => {
        if (cancelled) return;
        setRoute(routeRes);
        setDrivers(driversRes.drivers);
        setVehicles(vehiclesRes.vehicles);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load route");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  async function withAction(fn: () => Promise<unknown>) {
    setActionError("");
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (error || !route) {
    return <ErrorBanner message={error || "Route not found"} />;
  }

  return (
    <div>
      <Link href="/dashboard/routes" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-text-faint hover:text-text">
        <IconChevronLeft width={14} height={14} /> Routes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-data text-[11px] tracking-[0.14em] text-text-faint uppercase">Route detail</div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-text sm:text-3xl">Route #{route.id}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <StatusBadge status={route.status} />
            <span>{route.driver?.name ?? "No driver assigned"}</span>
            <span className="text-text-faint">·</span>
            <span>{route.vehicle?.name ?? "No vehicle assigned"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={`${inputClass} w-auto`}
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) withAction(() => api.assignDriver(route.id, e.target.value));
            }}
          >
            <option value="">Assign driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className={`${inputClass} w-auto`}
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) withAction(() => api.assignVehicle(route.id, e.target.value));
            }}
          >
            <option value="">Assign vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicleNumber}
              </option>
            ))}
          </select>
          <select
            className={`${inputClass} w-auto`}
            value={route.status}
            disabled={busy}
            onChange={(e) => withAction(() => api.updateRouteStatus(route.id, e.target.value))}
          >
            {ROUTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => withAction(() => api.dispatchRoute(route.id))}
          >
            <IconBolt width={16} height={16} /> Dispatch
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-text">Beacon path</h2>
            <span className="font-data text-xs text-text-faint">
              {route.distanceKm} km · {route.durationMinutes} min
            </span>
          </div>
          <BeaconPath route={route} />
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-text">Stop manifest</h2>
            <span className="font-data text-xs text-text-faint">
              {route.completedStops}/{route.totalStops}
            </span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {route.stops.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-faint">No stops on this route yet.</p>
            ) : (
              route.stops.map((s, i) => (
                <div key={`${s.orderId}-${i}`} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                  <SequenceStamp n={s.sequence ?? i + 1} tone={s.status === "DELIVERED" ? "done" : "muted"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-data text-xs text-text-faint">{s.orderId}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-0.5 truncate text-sm text-text">{s.address ?? "No address on file"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * The signature visual of this app: a dashed "beacon path" connecting a
 * route's stops in sequence, projected from their raw lat/lng onto an SVG
 * canvas (no external map tiles/API keys involved). Each stop renders as
 * a small octagonal stamp; the first non-delivered stop pulses like a beacon
 * to mark the vehicle's current position.
 */
function BeaconPath({ route }: { route: RouteDetail }) {
  const points = useMemo(() => {
    const valid = route.stops
      .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    if (valid.length === 0) return [];

    const lats = valid.map((s) => s.latitude as number);
    const lngs = valid.map((s) => s.longitude as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = maxLat - minLat || 1;
    const lngSpan = maxLng - minLng || 1;

    const pad = 12;
    return valid.map((s) => {
      const x = pad + ((s.longitude! - minLng) / lngSpan) * (100 - pad * 2);
      // invert latitude: higher lat should render nearer the top
      const y = pad + (1 - (s.latitude! - minLat) / latSpan) * (100 - pad * 2);
      return { ...s, x, y };
    });
  }, [route.stops]);

  if (points.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border-strong text-sm text-text-faint">
        Not enough located stops to plot a path yet.
      </div>
    );
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const currentIndex = points.findIndex((p) => p.status !== "DELIVERED");

  return (
    <div className="relative rounded-lg border border-border bg-bg-elevated/60 p-3">
      <svg viewBox="0 0 100 100" className="h-64 w-full sm:h-80" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-border)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <path d={pathD} fill="none" stroke="var(--color-beacon)" strokeOpacity="0.7" strokeWidth="0.6" strokeDasharray="1.6 1.4" strokeLinecap="round" />
        {points.map((p, i) => {
          const isCurrent = i === currentIndex;
          const isDone = p.status === "DELIVERED";
          return (
            <g key={`${p.orderId}-${i}`} transform={`translate(${p.x} ${p.y})`}>
              {isCurrent && <circle r="3.2" fill="var(--color-beacon)" fillOpacity="0.18" className="animate-beacon" />}
              <circle
                r="1.7"
                fill={isCurrent ? "var(--color-beacon)" : isDone ? "var(--color-signal)" : "var(--color-bg-elevated)"}
                stroke={isDone ? "var(--color-signal)" : "var(--color-border-strong)"}
                strokeWidth="0.35"
              />
              <text x="0" y="-2.6" textAnchor="middle" fontSize="2.6" fill="var(--color-text-muted)" fontFamily="var(--font-data)">
                {p.sequence ?? i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-text-faint">
        <LegendDot color="var(--color-bg-elevated)" border label="Pending" />
        <LegendDot color="var(--color-beacon)" label="Current" />
        <LegendDot color="var(--color-signal)" label="Delivered" />
      </div>
    </div>
  );
}

function LegendDot({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, border: border ? "1px solid var(--color-border-strong)" : undefined }}
      />
      {label}
    </span>
  );
}

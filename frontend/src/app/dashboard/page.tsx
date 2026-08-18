"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type RouteSummary, type RouteListItem, type Order } from "../../lib/api";
import { PageHeader, StatTile, Card, StatusBadge, Spinner, ErrorBanner, EmptyState } from "../components/ui";
import { IconRoute, IconPin, IconClock, IconBolt } from "../components/icons";

export default function OverviewPage() {
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, routesRes, ordersRes] = await Promise.all([
          api.getRouteSummary(),
          api.getRoutes(),
          api.getOrders(),
        ]);
        if (cancelled) return;
        setSummary(summaryRes);
        setRoutes(routesRes.routes);
        setOrders(ordersRes);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader
        eyebrow="Operations / Overview"
        title="Console overview"
        description={`Snapshot for ${today}. Live counts from routes, orders and fleet.`}
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total routes" value={summary?.totalRoutes ?? 0} caption="Across all drivers" icon={<IconRoute />} />
            <StatTile label="Total stops" value={summary?.totalStops ?? 0} caption="Orders ready to deliver" icon={<IconPin />} />
            <StatTile
              label="Total distance"
              value={`${summary?.totalDistanceKm ?? 0} km`}
              caption="Planned across active routes"
              icon={<IconBolt />}
            />
            <StatTile
              label="Est. duration"
              value={formatMinutes(summary?.estimatedDurationMinutes)}
              caption={`${summary?.activeDrivers ?? 0} drivers on the road`}
              icon={<IconClock />}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Card className="p-5 xl:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-text">Today&apos;s routes</h2>
                <Link href="/dashboard/routes" className="text-xs font-medium text-beacon hover:text-beacon-strong">
                  View all →
                </Link>
              </div>
              {routes.length === 0 ? (
                <EmptyState title="No routes yet" description="Create a route once you have stops ready to plan." />
              ) : (
                <div className="space-y-2">
                  {routes.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      href={`/dashboard/routes/${r.id}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-data text-xs text-text-faint">#{r.id}</span>
                          <span className="truncate text-sm font-medium text-text">{r.driver?.name ?? "Unassigned"}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-text-faint">
                          {r.completedStops}/{r.totalStops} stops · {r.distanceKm} km
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-text">Recent orders</h2>
                <Link href="/dashboard/orders" className="text-xs font-medium text-beacon hover:text-beacon-strong">
                  View all →
                </Link>
              </div>
              {orders.length === 0 ? (
                <EmptyState title="No orders yet" description="Add an order to start building a route." />
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-data text-xs text-text-faint">ORD-{o.id}</span>
                          <span className="truncate text-sm font-medium text-text">{o.customer_name}</span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-text-faint">{o.address}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function formatMinutes(total?: number) {
  if (!total) return "0h 00m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

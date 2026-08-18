"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../context/auth-context";
import { FullPageLoader } from "../components/ui";
import { ThemeToggle } from "../components/theme";
import { IconRadar, IconPackage, IconRoute, IconDriver, IconTruck, IconLogout } from "../components/icons";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: IconRadar, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: IconPackage },
  { href: "/dashboard/routes", label: "Routes", icon: IconRoute },
  { href: "/dashboard/drivers", label: "Drivers", icon: IconDriver },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: IconTruck },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-elevated/60 lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-beacon-soft">
            <span className="h-2.5 w-2.5 rounded-full bg-beacon animate-beacon" />
          </span>
          <div>
            <div className="font-display text-base font-semibold leading-none text-text">Devorbits</div>
            <div className="mt-1 font-data text-[10px] tracking-[0.16em] text-text-faint uppercase">Vendor Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-beacon-soft text-beacon-strong"
                    : "text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <Icon className={active ? "text-beacon" : "text-text-faint"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface font-display text-xs font-semibold text-text">
              {(user?.name || "V")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{user?.name}</div>
              <div className="truncate text-xs text-text-faint">{user?.role}</div>
            </div>
            <ThemeToggle className="h-7 w-7 shrink-0" />
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="shrink-0 rounded-md p-1.5 text-text-faint transition-colors hover:bg-alert-soft hover:text-alert"
            >
              <IconLogout width={17} height={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-bg-elevated/60 px-3 py-2 lg:hidden">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              active ? "bg-beacon-soft text-beacon-strong" : "text-text-muted"
            }`}
          >
            <Icon width={15} height={15} />
            {item.label}
          </Link>
        );
      })}
      <ThemeToggle className="ml-auto h-7 w-7 shrink-0" />
    </div>
  );
}

import type { ReactNode, ButtonHTMLAttributes } from "react";
import { IconClose } from "./icons";

/** Maps a backend status string to the console's semantic color + label. */
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label?: string }> = {
  PENDING: { bg: "bg-beacon-soft", text: "text-beacon-strong", border: "border-beacon/30" },
  PLANNED: { bg: "bg-info-soft", text: "text-info", border: "border-info/30" },
  ASSIGNED: { bg: "bg-info-soft", text: "text-info", border: "border-info/30" },
  READY: { bg: "bg-info-soft", text: "text-info", border: "border-info/30" },
  DISPATCHED: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30" },
  IN_PROGRESS: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30", label: "IN TRANSIT" },
  IN_TRANSIT: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30" },
  DELIVERED: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30" },
  COMPLETED: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30" },
  CANCELLED: { bg: "bg-alert-soft", text: "text-alert", border: "border-alert/30" },
  FAILED: { bg: "bg-alert-soft", text: "text-alert", border: "border-alert/30" },
  AVAILABLE: { bg: "bg-signal-soft", text: "text-signal", border: "border-signal/30" },
  IN_USE: { bg: "bg-beacon-soft", text: "text-beacon-strong", border: "border-beacon/30" },
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const key = status?.toUpperCase?.() ?? "";
  const style = STATUS_STYLES[key] || {
    bg: "bg-surface",
    text: "text-text-muted",
    border: "border-border-strong",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-data text-[10px] font-medium tracking-[0.12em] uppercase ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {style.label || key.replace(/_/g, " ")}
    </span>
  );
}

/** Small octagonal "stamp" badge used for sequence numbers on a route path. */
export function SequenceStamp({
  n,
  tone = "muted",
}: {
  n: number | string;
  tone?: "muted" | "beacon" | "signal" | "done";
}) {
  const toneClasses: Record<string, string> = {
    muted: "bg-surface border-border-strong text-text-muted",
    beacon: "bg-beacon text-on-accent border-beacon animate-beacon",
    signal: "bg-signal text-on-accent border-signal",
    done: "bg-transparent border-signal/50 text-signal",
  };
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border font-data text-xs font-semibold ${toneClasses[tone]}`}
      style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
    >
      {n}
    </span>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "subtle" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-beacon text-on-accent hover:bg-beacon-strong shadow-[0_0_0_1px_rgba(255,145,66,0.3)]",
    ghost: "border border-border-strong text-text hover:bg-surface-hover",
    subtle: "bg-surface text-text-muted hover:text-text hover:bg-surface-hover border border-border",
    danger: "bg-alert/10 text-alert border border-alert/30 hover:bg-alert/20",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface/60 backdrop-blur-sm ${className}`}>{children}</div>
  );
}

export function StatTile({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-text-faint">{label}</span>
        {icon && <span className="text-beacon">{icon}</span>}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-text">{value}</div>
      {caption && <div className="mt-1 text-xs text-text-faint">{caption}</div>}
    </Card>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 font-data text-[11px] font-medium tracking-[0.18em] text-text-faint uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
      <div className="mb-3 h-10 w-10 rounded-full border border-border-strong" />
      <h3 className="font-display text-base font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-beacon ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-alert/30 bg-alert-soft px-4 py-3 text-sm text-alert">{message}</div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-border-strong bg-bg-elevated p-6 shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-text-faint transition-colors hover:bg-surface-hover hover:text-text"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  required,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">
        {label} {required && <span className="text-beacon">*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-beacon";

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useAuth } from "../context/auth-context";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Field, inputClass, ErrorBanner, Spinner } from "../components/ui";
import { RadarPanel } from "../components/brand-panel";
import { ThemeToggle } from "../components/theme";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="font-data text-[11px] tracking-[0.18em] text-text-faint uppercase">Devorbits</div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text">Sign in to your console</h1>
        <p className="mt-1.5 text-sm text-text-muted">Plan routes, dispatch drivers and track deliveries.</p>
      </div>

      {isRegistered && (
        <div className="mb-5 rounded-lg border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-signal">
          Registration received — your business is pending admin approval.
        </div>
      )}
      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" htmlFor="email" required>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="name@company.com"
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-11`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-faint hover:text-text-muted"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? <Spinner className="h-4 w-4" /> : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-faint">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-beacon hover:text-beacon-strong">
          Register your business
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen bg-bg">
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <Suspense
          fallback={
            <div className="flex h-64 w-full max-w-sm items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
      <RadarPanel />
    </div>
  );
}

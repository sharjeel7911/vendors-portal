"use client";

import { useState } from "react";
import { useAuth } from "../context/auth-context";
import Link from "next/link";
import { Button, Field, inputClass, ErrorBanner, Spinner } from "../components/ui";
import { RadarPanel } from "../components/brand-panel";
import { ThemeToggle } from "../components/theme";

export default function RegisterPage() {
  const { register } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register({ businessName, name, email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-bg">
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="font-data text-[11px] tracking-[0.18em] text-text-faint uppercase">Devorbits</div>
            <h1 className="mt-2 font-display text-2xl font-semibold text-text">Register your business</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Create a vendor account. An admin will review and approve it shortly after.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Business name" htmlFor="businessName" required>
              <input
                id="businessName"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
                placeholder="Apex Logistics"
              />
            </Field>

            <Field label="Your full name" htmlFor="name" required>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Jane Doe"
              />
            </Field>

            <Field label="Email address" htmlFor="email" required>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="jane@apex.com"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" htmlFor="password" required>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirm" htmlFor="confirmPassword" required>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? <Spinner className="h-4 w-4" /> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-faint">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-beacon hover:text-beacon-strong">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <RadarPanel />
    </div>
  );
}

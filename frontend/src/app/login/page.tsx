'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '../context/auth-context';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 backdrop-blur-md bg-white/10 dark:bg-black/40 border border-white/20 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

      <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
        Vendor Portal
      </h2>
      <p className="text-sm text-center text-zinc-400 mb-6">
        Sign in to manage your fleet and optimize routes
      </p>

      {isRegistered && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg text-center animate-pulse">
          Registration successful! Account is pending admin approval.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-200 outline-none transition-all placeholder:text-zinc-600 text-sm"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-zinc-200 outline-none transition-all placeholder:text-zinc-600 text-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-purple-500/20 flex items-center justify-center text-sm"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
          Register business
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans antialiased text-white">
      {/* Background Graphic */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white/10 dark:bg-black/40 border border-white/20 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

'use client';

import { useAuth } from '../context/auth-context';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <div className="max-w-4xl mx-auto backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-2xl relative shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Vendor Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Welcome back to your operational panel
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl transition-all font-semibold text-sm active:scale-[0.98]"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">User Details</h3>
            <div className="space-y-2 text-sm text-zinc-300">
              <p><span className="text-zinc-500 font-medium">Name:</span> {user?.name}</p>
              <p><span className="text-zinc-500 font-medium">Email:</span> {user?.email}</p>
              <p><span className="text-zinc-500 font-medium">Role:</span> <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20">{user?.role}</span></p>
              <p><span className="text-zinc-500 font-medium">Status:</span> <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">{user?.status}</span></p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-pink-400 mb-2">Vendor Scope</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                All resource queries (Fleet, Orders, Routes) are cryptographically scoped to your Vendor ID to enforce absolute multi-tenant boundary.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500">
              Scoped Vendor ID: <code className="bg-black/40 px-2 py-1 rounded text-pink-400">{user?.vendor_id || 'N/A'}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

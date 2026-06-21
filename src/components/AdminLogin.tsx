import React, { useState } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";
import { ShieldAlert, Mail, Lock, LogIn, ChevronRight } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onForgotPassword: () => void;
}

export default function AdminLogin({ onLoginSuccess, onForgotPassword }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.loginAdmin({ email, password });
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = () => {
    setEmail("admin@bhoomione.in");
    setPassword("AdminPassword123!");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8" id="admin-login-card">
      <div className="flex justify-center mb-6" id="admin-login-icon">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 text-center mb-1">
        Web-Admin Portal Login
      </h2>
      <p className="text-xs text-slate-500 text-center mb-6">
        Authenticate with global system authority to supervise directories
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2" id="admin-login-err">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Helpful Pre-fill Assistant */}
      <button
        type="button"
        onClick={handlePreFill}
        className="w-full mb-6 p-3 bg-zinc-50 hover:bg-zinc-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
        id="autofill-admin-btn"
      >
        <div>
          <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-0.5">
            Seed Sandbox Account
          </p>
          <p className="text-xs text-slate-600 font-mono">
            admin@bhoomione.in / AdminPassword123!
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      <form onSubmit={handleSubmit} className="space-y-4" id="admin-login-form">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Global Admin Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              placeholder="e.g. admin@bhoomione.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-700">
              Password Security Key
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-50"
          id="admin-submit-btn"
        >
          {loading ? (
            "Authenticating Authority..."
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Authorize Administrator</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

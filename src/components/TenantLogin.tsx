import React, { useState, useEffect } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";
import { Building2, Mail, Lock, LogIn, ChevronRight, Hash, Info } from "lucide-react";

interface TenantLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onForgotPassword: () => void;
  defaultTenantCode?: string | null;
}

export default function TenantLogin({ onLoginSuccess, onForgotPassword, defaultTenantCode }: TenantLoginProps) {
  const [tenantCode, setTenantCode] = useState(defaultTenantCode || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultTenantCode) {
      setTenantCode(defaultTenantCode);
    }
  }, [defaultTenantCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantCode || !email || !password) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.loginTenant({ email, password }, tenantCode);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate tenant worker profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8" id="tenant-login-card">
      <div className="flex justify-center mb-6" id="tenant-login-hdr">
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 text-center mb-1">
        Web-Tenant Portal Login
      </h2>
      <p className="text-xs text-slate-500 text-center mb-6">
        Log in to your private developer or broker workspace environment
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2" id="tenant-login-err">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Info message for credentials source */}
      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex gap-2.5 items-start">
        <Info className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Use credentials provided by your platform administrator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="tenant-login-form">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tenant Code or Domain Identifier
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Hash className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              placeholder="e.g. workspace-code"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Developer Account Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              placeholder="e.g. admin@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-700">
              Password SECURITY KEY
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
          id="tenant-submit-btn"
        >
          {loading ? (
            "Verifying Workspace Integrity..."
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Authorize Developer Access</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

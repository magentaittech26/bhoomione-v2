import React, { useState } from "react";
import api from "../lib/api.ts";
import { KeyRound, Mail, AlertTriangle, CheckCircle } from "lucide-react";

interface PasswordResetProps {
  onBackToLogin: () => void;
}

export default function PasswordReset({ onBackToLogin }: PasswordResetProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "submit">("request");
  const [message, setMessage] = useState("");
  const [sandboxToken, setSandboxToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.requestPasswordReset(email);
      setStep("submit");
      setMessage(res.message);
      if (res.tokenSymbolReferenceSandbox) {
        setSandboxToken(res.tokenSymbolReferenceSandbox);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token || !newPassword) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.submitPasswordReset({
        email,
        token,
        newPassword,
      });
      setMessage(res.message);
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Credential modification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-8" id="password-reset-card">
      <div className="flex justify-center mb-6" id="password-reset-hdr">
        <div className="p-3 bg-zinc-50 border border-slate-100 rounded-lg text-slate-700">
          <KeyRound className="w-6 h-6" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 text-center mb-1">
        Password Reset Foundation
      </h2>
      <p className="text-xs text-slate-500 text-center mb-6">
        Recover authentication credentials safely using audited framework tokens
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-xs text-red-600" id="reset-err">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2 text-xs text-emerald-700" id="reset-success">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{message}</p>
            {sandboxToken && (
              <p className="mt-1 font-mono bg-white p-1.5 border border-emerald-200 rounded text-emerald-800 break-all select-all">
                Audited Sandbox Token: {sandboxToken}
              </p>
            )}
          </div>
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4" id="reset-req-form">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Registered Profile Email
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-50"
            id="req-token-btn"
          >
            {loading ? "Generating Verification Token..." : "Issue Reset Token"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" id="reset-sub-form">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800 mb-2">
            Copy the <strong>"Audited Sandbox Token"</strong> issued above and paste it into the validation token field below to verify security parameters.
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Validation Token
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BHOOMI-RST-XXXXX"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              New Secure Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 elements"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-50"
            id="submit-reset-btn"
          >
            {loading ? "Updating Secrets..." : "Authorize Password Override"}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onBackToLogin}
          type="button"
          className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
          id="back-to-login-btn"
        >
          Return to login portal choice
        </button>
      </div>
    </div>
  );
}

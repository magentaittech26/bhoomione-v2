import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MarketplaceErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught exception in MarketplaceApp:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12" id="marketplace-error-boundary">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <AlertTriangle className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold tracking-tight text-slate-100">
                  Marketplace Portal Temporarily Offline
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  The marketplace platform experienced a runtime loading exception. This could be due to unexpected API response formats or unaligned data state properties. Our resilient guards have intercepted the error to keep the main application workspace healthy.
                </p>
                {this.state.error && (
                  <div className="bg-slate-950 rounded-xl p-3.5 font-mono text-xs text-rose-350 border border-slate-800 max-w-xl break-all">
                    Error trace: {this.state.error.message || String(this.state.error)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Discovery Portal
              </button>
              <p className="text-[11px] text-slate-500 font-medium">BhoomiOne Enterprise Sandbox Isolation Layer</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class InventoryManagerErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught exception in InventoryManager:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 lg:p-8 space-y-4 shadow-sm my-6" id="inventory-error-boundary">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Inventory Manager Canvas Offline
              </h3>
              <p className="text-xs text-slate-550 leading-relaxed max-w-2xl">
                The inventory interface encountered a runtime rendering exception. This can be caused by un-synchronized relational parameters or strict browser execution constraints in active partitions. 
              </p>
              {this.state.error && (
                <div className="bg-rose-100/50 rounded-lg p-2.5 font-mono text-[10px] text-rose-900 border border-rose-150/50 max-w-xl break-all">
                  Error: {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-rose-100 pl-14">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Local Sandbox
            </button>
            <p className="text-[10.5px] text-slate-400 font-medium">Your parent session remains completely isolated and authenticated.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

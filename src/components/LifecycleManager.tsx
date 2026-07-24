import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  History,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  LifecycleStateSummary,
  AvailableTransition,
  StateColorToken,
} from '../types/lifecycle';
import {
  fetchLifecycleState,
  performTransition,
  evaluateTransition,
} from '../lib/lifecycleClient';

interface LifecycleManagerProps {
  entityType: string;
  entityId: string;
  initialState?: string;
  onStateChange?: (newState: string) => void;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({
  entityType,
  entityId,
  initialState = 'DRAFT',
  onStateChange,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LifecycleStateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<AvailableTransition | null>(null);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadLifecycle = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchLifecycleState(entityType, entityId);
      setData(summary);
    } catch (err: any) {
      // Fallback mock representation if server unreachable
      setData({
        lifecycle_code: `${entityType}.lifecycle`,
        lifecycle_version: '1.0.0',
        entity_type: entityType,
        entity_id: entityId,
        current_state: initialState,
        available_transitions: [],
        recent_history: [],
      });
      setError(err.message || 'Failed to load lifecycle state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLifecycle();
  }, [entityType, entityId]);

  const handleTransitionClick = (transition: AvailableTransition) => {
    setSelectedTransition(transition);
    setReason('');
    setFeedback(null);
  };

  const executeTransition = async () => {
    if (!selectedTransition || !data) return;

    setSubmitting(true);
    setFeedback(null);

    const idempotencyKey = `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await performTransition(
        entityType,
        entityId,
        selectedTransition.transition_code,
        data.current_state,
        reason,
        idempotencyKey
      );

      if (response.success && response.data) {
        setFeedback({
          type: 'success',
          message: response.message || `Transition [${selectedTransition.name}] completed successfully.`,
        });
        if (onStateChange) {
          onStateChange(response.data.destination_state);
        }
        setSelectedTransition(null);
        setReason('');
        await loadLifecycle();
      } else {
        const errorMsg = response.error?.failures?.[0]?.message || response.message || 'Transition blocked by lifecycle engine.';
        setFeedback({
          type: 'error',
          message: errorMsg,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred during state transition.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getColorTokenClasses = (token: StateColorToken = 'neutral'): string => {
    switch (token) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      case 'negative':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
      case 'informational':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Lifecycle Engine State...</span>
      </div>
    );
  }

  const currentState = data?.current_state || initialState;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* HEADER & CURRENT STATE */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Lifecycle Governance Engine
            </h3>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
              {data?.lifecycle_code} (v{data?.lifecycle_version})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative state engine with business rules & idempotency enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current State:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getColorTokenClasses(
              currentState === 'ACTIVE' || currentState === 'APPROVED' || currentState === 'REGISTERED' ? 'positive' : 'informational'
            )}`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {currentState}
          </span>
          <button
            onClick={loadLifecycle}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-lg text-xs flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold">{feedback.type === 'success' ? 'Success' : 'Transition Blocked'}: </span>
            {feedback.message}
          </div>
        </div>
      )}

      {/* AVAILABLE TRANSITIONS */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Available Allowed Transitions
        </h4>

        {(!data?.available_transitions || data.available_transitions.length === 0) ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            No further transitions available from terminal state [{currentState}].
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.available_transitions.map((t) => (
              <div
                key={t.transition_code}
                className={`p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  t.permitted
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {t.name}
                      {!t.permitted && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      → {t.destination_state}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t.description}</p>

                  {/* SHOW BLOCKING REASONS */}
                  {!t.permitted && t.failures.length > 0 && (
                    <div className="mt-2 p-2 bg-rose-50/80 dark:bg-rose-950/40 rounded border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                      {t.failures.map((f, i) => (
                        <div key={i} className="text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">{t.transition_code}</span>

                  <button
                    onClick={() => handleTransitionClick(t)}
                    disabled={!t.permitted}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      t.permitted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-sm'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Execute <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION / REASON MODAL */}
      {selectedTransition && (
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Confirm Transition: {selectedTransition.name}
            </h5>
            <button
              onClick={() => setSelectedTransition(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are about to transition <span className="font-semibold">{entityType}</span> [{entityId}] from{' '}
            <span className="font-semibold">{currentState}</span> to{' '}
            <span className="font-semibold">{selectedTransition.destination_state}</span>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transition Reason / Audit Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason or justification for this state change..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setSelectedTransition(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={executeTransition}
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md flex items-center gap-1.5"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Authoritative Commit
            </button>
          </div>
        </div>
      )}

      {/* AUDIT LOG HISTORY */}
      {data?.recent_history && data.recent_history.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            Transition Audit Trail ({data.recent_history.length})
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {data.recent_history.map((h) => (
              <div
                key={h.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">
                    {h.transition_code}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate">
                    {h.previous_state} → <span className="text-indigo-600 dark:text-indigo-400 font-bold">{h.destination_state}</span>
                  </span>
                  {h.reason && (
                    <span className="text-slate-400 italic truncate max-w-xs">({h.reason})</span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(h.transitioned_at).toLocaleTimeString()}
                  </span>
                  <span>Corr: {h.correlation_id?.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

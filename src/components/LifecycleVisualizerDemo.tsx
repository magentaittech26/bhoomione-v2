import React, { useState } from 'react';
import { LifecycleManager } from './LifecycleManager';
import { Layers, MapPin, Building, Calendar, CreditCard, Shield, CheckCircle, Info } from 'lucide-react';

export const LifecycleVisualizerDemo: React.FC = () => {
  const [activeEntityType, setActiveEntityType] = useState<string>('project');
  const [activeEntityId, setActiveEntityId] = useState<string>('PROJ-1001');

  const entities = [
    { type: 'project', id: 'PROJ-1001', name: 'Greenfield City (Project)', icon: Building },
    { type: 'layout', id: 'LAY-2002', name: 'Phase 1 Master Layout (Layout)', icon: Layers },
    { type: 'map_version', id: 'MAP-3003', name: 'DXF Cadastral Vector Map v1 (Map)', icon: MapPin },
    { type: 'plot', id: 'PLOT-4004', name: 'Corner Plot #104 (Plot)', icon: MapPin },
    { type: 'booking', id: 'BKG-5005', name: 'Customer Booking #5005 (Booking)', icon: Calendar },
    { type: 'payment', id: 'RCPT-6006', name: 'Bank Transfer Receipt #6006 (Collection)', icon: CreditCard },
  ];

  const currentEntity = entities.find((e) => e.type === activeEntityType) || entities[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight">Lifecycle Engine Framework</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                Core Phase 3 Engine
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Authoritative, multi-tenant state machine engine governing state transitions across all 6 reference domain entities with BRE enforcement and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            {entities.map((e) => {
              const Icon = e.icon;
              const active = activeEntityType === e.type;
              return (
                <button
                  key={e.type}
                  onClick={() => {
                    setActiveEntityType(e.type);
                    setActiveEntityId(e.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="capitalize">{e.type.replace('_', ' ')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* METRIC BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Reference Domain Lifecycles</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">6 Domain Providers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">BRE Integration</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Pre-Commit Check</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Idempotency Lock</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Hash Deduplication</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Test Target</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{currentEntity.id}</div>
          </div>
        </div>
      </div>

      {/* ACTIVE LIFECYCLE INTERACTIVE MANAGER */}
      <LifecycleManager
        entityType={activeEntityType}
        entityId={activeEntityId}
      />
    </div>
  );
};

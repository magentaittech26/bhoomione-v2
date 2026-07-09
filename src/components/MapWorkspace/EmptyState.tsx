import React from "react";
import { HelpCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl" id="workspace-empty-state">
      <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-slate-400 mb-3" id="empty-state-icon">
        {icon || <HelpCircle className="w-6 h-6 text-slate-400" />}
      </div>
      <h4 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{description}</p>
    </div>
  );
}

'use client';

import React from 'react';
import {
  Compass,
  Search,
  Cpu,
  ShieldCheck,
  FileText,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface AgentNodeBadgeProps {
  nodeName: string;
  status?: 'idle' | 'active' | 'completed' | 'retry' | 'error';
  compact?: boolean;
}

export const AgentNodeBadge: React.FC<AgentNodeBadgeProps> = ({
  nodeName,
  status = 'idle',
  compact = false,
}) => {
  const getIcon = () => {
    switch (nodeName) {
      case 'supervisor':
        return <Compass className="w-3.5 h-3.5" />;
      case 'research_agent':
        return <Search className="w-3.5 h-3.5" />;
      case 'retriever_agent':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'evaluator_agent':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'synthesizer_agent':
        return <FileText className="w-3.5 h-3.5" />;
      case 'formatter_agent':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  const getLabel = () => {
    switch (nodeName) {
      case 'supervisor':
        return 'Router (Supervisor)';
      case 'research_agent':
        return 'Planner (Research)';
      case 'retriever_agent':
        return 'Retriever';
      case 'evaluator_agent':
        return 'Evaluator';
      case 'synthesizer_agent':
        return 'Synthesizer';
      case 'formatter_agent':
        return 'Writer (Formatter)';
      default:
        return nodeName;
    }
  };

  if (compact) {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        {getIcon()}
        <span>{getLabel()}</span>
      </span>
    );
  }

  const getStatusStyles = () => {
    if (status === 'active') {
      return 'bg-emerald-950/80 text-emerald-400 border-emerald-500 matrix-glow ring-2 ring-emerald-500/40 font-mono';
    }
    if (status === 'completed') {
      return 'bg-emerald-950/40 text-emerald-400/90 border-emerald-800/80 font-mono';
    }
    if (status === 'retry') {
      return 'bg-amber-950/60 text-amber-400 border-amber-500/60 animate-pulse font-mono';
    }
    return 'bg-slate-900/40 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-500 border-slate-300 dark:border-zinc-800 font-mono';
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200 text-xs font-medium ${getStatusStyles()}`}
    >
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span>{getLabel()}</span>
      </div>
      {status === 'active' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
      {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
      {status === 'retry' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
    </div>
  );
};

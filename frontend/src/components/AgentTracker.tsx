'use client';

import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { AgentNodeBadge } from './AgentNodeBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitGraph,
  ArrowDown,
  Layers,
  Search,
  AlertTriangle,
  FileSearch,
  Terminal,
} from 'lucide-react';

const WORKFLOW_NODES = [
  'supervisor',
  'research_agent',
  'retriever_agent',
  'evaluator_agent',
  'synthesizer_agent',
  'formatter_agent',
] as const;

export const AgentTracker: React.FC = () => {
  const {
    activeNode,
    subQueries,
    currentSubQueryIndex,
    retrievalAttempts,
    evaluationStatus,
    accumulatedSources,
    isSidebarOpen,
    isStreaming,
  } = useChatStore();

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-black/90 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto p-4 transition-all duration-200">
      {/* Sidebar Header */}
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200 dark:border-zinc-800">
        <GitGraph className="w-5 h-5 text-emerald-400" />
        <h2 className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
          WORKFLOW_TIMELINE
        </h2>
      </div>

      {/* Graph Visualizer DAG */}
      <div className="space-y-2 mb-6">
        <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
          LANGGRAPH EXECUTION DAG
        </p>

        {WORKFLOW_NODES.map((node, idx) => {
          const isActive = activeNode === node;
          const isCompleted = !isStreaming && activeNode === 'END';
          const isRetryNode = node === 'evaluator_agent' && evaluationStatus === 'RETRY';

          let status: 'idle' | 'active' | 'completed' | 'retry' = 'idle';
          if (isActive) status = 'active';
          if (isRetryNode) status = 'retry';
          if (isCompleted) status = 'completed';

          return (
            <React.Fragment key={node}>
              <motion.div
                animate={{ scale: isActive ? 1.03 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <AgentNodeBadge nodeName={node} status={status} />
              </motion.div>
              {idx < WORKFLOW_NODES.length - 1 && (
                <div className="flex justify-center my-1 text-emerald-500/40 dark:text-emerald-500/30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Retry Loop Banner */}
      <AnimatePresence>
        {evaluationStatus === 'RETRY' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs space-y-1 font-mono"
          >
            <div className="flex items-center space-x-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>SELF_CORRECTION_LOOP</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Evaluator flagged insufficient context (Attempt #{retrievalAttempts}). Retrying retrieval with refined terms.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Queries Breakdown */}
      {subQueries.length > 0 && (
        <div className="mb-6 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              DECOMPOSED SUB-QUERIES
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {currentSubQueryIndex + 1}/{subQueries.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {subQueries.map((subQ, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg text-xs border transition ${
                  idx === currentSubQueryIndex
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium matrix-glow'
                    : 'bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <Search className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                  <span className="line-clamp-2">{subQ}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Metrics Card */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span className="flex items-center space-x-1.5">
            <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
            <span>GROUNDED CHUNKS</span>
          </span>
          <span className="font-bold text-emerald-400">
            {accumulatedSources.length}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>RETRIEVAL ATTEMPTS</span>
          </span>
          <span className="font-bold text-emerald-400">
            #{retrievalAttempts}
          </span>
        </div>
      </div>
    </aside>
  );
};

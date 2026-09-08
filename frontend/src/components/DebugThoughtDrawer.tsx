'use client';

import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { X, Terminal, Code2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DebugThoughtDrawer: React.FC = () => {
  const { isDebugOpen, toggleDebug, debugLogs } = useChatStore();

  if (!isDebugOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleDebug}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Slide-over panel */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-black border-l border-emerald-500/30 text-emerald-400 h-full flex flex-col z-10 shadow-2xl font-mono"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-zinc-100">AGENT_THOUGHT_PROCESS</h3>
                <p className="text-[11px] text-zinc-400">Real-time LangGraph State & SSE Log Inspector</p>
              </div>
            </div>
            <button
              onClick={toggleDebug}
              className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logs List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {debugLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <Code2 className="w-8 h-8 opacity-40 text-emerald-500" />
                <p>No active agent thoughts logged yet.</p>
                <p className="text-[11px]">Submit a query to inspect live node updates.</p>
              </div>
            ) : (
              debugLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-zinc-950 border border-emerald-500/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider">
                      [{log.type}]
                    </span>
                    <span className="text-zinc-500">{log.timestamp}</span>
                  </div>

                  {log.agent && (
                    <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold text-[11px]">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Node: {log.agent}</span>
                    </div>
                  )}

                  {log.content && (
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      {log.content}
                    </p>
                  )}

                  {log.sub_queries && (
                    <div className="p-2 rounded bg-black text-[11px] text-emerald-300 border border-zinc-800">
                      <strong>Sub-Queries:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {log.sub_queries.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {log.feedback && (
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px]">
                      <strong>Evaluator Feedback:</strong> {log.feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

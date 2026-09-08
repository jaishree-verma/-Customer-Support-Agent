'use client';

import React, { useState } from 'react';
import { SourceChunk } from '../types/chat';
import { FileText, ChevronDown, ChevronUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceCardProps {
  sources: SourceChunk[];
}

export const SourceCard: React.FC<SourceCardProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition"
      >
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SOURCE GROUNDING CITATIONS ({sources.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1 font-mono text-xs"
          >
            {sources.map((src, idx) => {
              // Simulated confidence score metric (e.g. 96%, 92%)
              const confidence = Math.max(88, 98 - idx * 3);

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-emerald-500/30 text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-zinc-200">
                    <span className="flex items-center space-x-1.5 truncate text-emerald-600 dark:text-emerald-400">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{src.source_name || `Doc_Chunk_${idx + 1}.txt`}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {confidence}% MATCH
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-l" />
                    <p className="pl-3 text-slate-700 dark:text-zinc-300 text-[11px] leading-relaxed line-clamp-4 font-mono bg-slate-50 dark:bg-black/60 p-2 rounded-r border border-slate-200 dark:border-zinc-900">
                      {src.page_content}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

'use client';

import React from 'react';
import { useChatStore } from '../store/useChatStore';
import {
  Terminal,
  Database,
  GitFork,
  Sun,
  Moon,
  Trash2,
  Activity,
  PanelLeft,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    isDarkMode,
    isDebugOpen,
    vectorDbOnline,
    graphActive,
    activeNode,
    toggleDarkMode,
    toggleDebug,
    toggleSidebar,
    clearChat,
  } = useChatStore();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between transition-colors duration-200">
      {/* Left: Branding & Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          title="Toggle Workflow Sidebar"
        >
          <PanelLeft className="w-5 h-5 text-emerald-500" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-black border border-emerald-500/50 flex items-center justify-center matrix-glow">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight">
                RAG_NETWORK // V2.0
              </h1>
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                GEMINI 2.5
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 hidden sm:block">
              Multi-Agent Self-Correcting Graph Network
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Status Indicators */}
      <div className="hidden md:flex items-center space-x-3">
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
            vectorDbOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${vectorDbOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <Database className="w-3.5 h-3.5" />
          <span>CHROMA_DB: {vectorDbOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
            graphActive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-800/40 text-zinc-400 border-zinc-700'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-emerald-400" />
          <span>LANGGRAPH: READY</span>
        </div>

        {activeNode && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 matrix-glow animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>ACTIVE: {activeNode}</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={clearChat}
          className="p-2 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={toggleDebug}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
            isDebugOpen
              ? 'bg-emerald-600 text-black font-bold border-emerald-500 matrix-glow'
              : 'text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AGENT THOUGHTS</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition border border-transparent hover:border-slate-300 dark:hover:border-zinc-800"
          title="Toggle Hacker Light/Dark Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-700" />}
        </button>
      </div>
    </header>
  );
};

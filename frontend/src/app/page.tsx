'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Navbar } from '../components/Navbar';
import { AgentTracker } from '../components/AgentTracker';
import { ChatInterface } from '../components/ChatInterface';
import { DebugThoughtDrawer } from '../components/DebugThoughtDrawer';

export default function Home() {
  const { isDarkMode, setHealthStatus } = useChatStore();

  // Sync theme class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check health status of Python FastAPI backend on load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data.vector_db_online ?? true, data.graph_active ?? true);
        } else {
          setHealthStatus(false, false);
        }
      } catch {
        setHealthStatus(false, false);
      }
    };
    checkHealth();
  }, [setHealthStatus]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <AgentTracker />
        <ChatInterface />
        <DebugThoughtDrawer />
      </div>
    </div>
  );
}

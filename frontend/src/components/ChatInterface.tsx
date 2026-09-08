'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { streamAgentQuery } from '../lib/sseClient';
import { MessageBubble } from './MessageBubble';
import { Send, Terminal, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const EXAMPLE_PROMPTS = [
  'What is the warranty period for the QuantumFlow QF-2025?',
  'How do I troubleshoot Wi-Fi and power connection issues?',
  'What are the installation steps for Zenith Smart Thermostat?',
];

export const ChatInterface: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    addMessage,
    processStepEvent,
    setIsStreaming,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isStreaming) return;

    setInputQuery('');
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    addMessage({
      id: userMsgId,
      sender: 'user',
      content: textToSend,
      timestamp,
    });

    addMessage({
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
      agentSteps: [],
      sources: [],
    });

    setIsStreaming(true);

    await streamAgentQuery(
      textToSend,
      userMsgId,
      (event) => {
        processStepEvent(event);
      },
      (error) => {
        console.error('Streaming error:', error);
        processStepEvent({
          type: 'ERROR',
          agent: 'System',
          content: `Connection error: ${error.message}. Ensure FastAPI server is active on port 8000.`,
        });
        setIsStreaming(false);
      },
      () => {
        setIsStreaming(false);
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-100/70 dark:bg-black transition-colors duration-200">
      {/* Scrollable Message Flow */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 my-auto py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-black border-2 border-emerald-500 flex items-center justify-center matrix-glow-lg">
              <Terminal className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                RAG_ASSISTANT_NETWORK
              </h2>
              <p className="text-xs font-mono text-slate-600 dark:text-zinc-400 leading-relaxed">
                Self-correcting multi-agent AI portal powered by LangGraph, ChromaDB vector store, and Google Gemini.
              </p>
            </div>

            {/* Example Prompt Chips */}
            <div className="w-full space-y-2.5 font-mono">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                PROMPT_TEMPLATES
              </p>
              <div className="flex flex-col space-y-2">
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-3.5 rounded-xl text-xs font-medium text-left bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 hover:border-emerald-500 text-slate-800 dark:text-zinc-300 hover:shadow-md hover:matrix-glow transition duration-200 flex items-center justify-between group"
                  >
                    <span>"{prompt}"</span>
                    <Zap className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-4xl mx-auto flex items-center space-x-2 bg-slate-50 dark:bg-black p-2 rounded-xl border border-slate-200 dark:border-zinc-800 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/30 transition"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? 'RAG Agent Network is processing query...'
                : 'Ask anything regarding product support, warranties, or specs...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isStreaming}
            className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold transition matrix-glow flex items-center justify-center shrink-0"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

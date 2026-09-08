'use client';

import React from 'react';
import { Message } from '../types/chat';
import { SourceCard } from './SourceCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Terminal, User, RefreshCw, Zap } from 'lucide-react';
import { AgentNodeBadge } from './AgentNodeBadge';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex space-x-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-emerald-500/50 flex items-center justify-center shrink-0 matrix-glow">
          <Terminal className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      <div
        className={`max-w-3xl rounded-2xl p-4 text-sm shadow-sm ${
          isUser
            ? 'bg-emerald-600 text-black font-semibold rounded-tr-none border border-emerald-500 matrix-glow'
            : 'bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-tl-none'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/10 dark:border-zinc-800">
          <span className="font-mono font-bold text-xs flex items-center space-x-1.5">
            {isUser ? (
              <span>USER_PROMPT</span>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>RAG_AGENT_NETWORK</span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono opacity-70">{message.timestamp}</span>
        </div>

        {/* Streaming Node Progress Indicator */}
        {!isUser && message.isStreaming && message.agentSteps && message.agentSteps.length > 0 && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span className="text-xs text-emerald-300">
                {message.agentSteps[message.agentSteps.length - 1].content || 'Processing workflow...'}
              </span>
            </div>
            {message.agentSteps[message.agentSteps.length - 1].agent && (
              <AgentNodeBadge
                nodeName={message.agentSteps[message.agentSteps.length - 1].agent!}
                compact
              />
            )}
          </div>
        )}

        {/* Content Body */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-mono">{message.content}</p>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (message.isStreaming ? 'Synthesizing response...' : '')}
            </ReactMarkdown>
          </div>
        )}

        {/* Grounded Source Cards */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCard sources={message.sources} />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-zinc-700">
          <User className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
};

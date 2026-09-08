import { create } from 'zustand';
import { Message, AgentStepEvent, AgentNodeName, SourceChunk } from '../types/chat';

interface ChatStore {
  messages: Message[];
  activeNode: AgentNodeName | string | null;
  subQueries: string[];
  currentSubQueryIndex: number;
  retrievalAttempts: number;
  evaluatorFeedback: string;
  evaluationStatus: 'APPROVED' | 'RETRY' | null;
  accumulatedSources: SourceChunk[];
  debugLogs: AgentStepEvent[];
  isStreaming: boolean;
  isDarkMode: boolean;
  isDebugOpen: boolean;
  isSidebarOpen: boolean;
  vectorDbOnline: boolean;
  graphActive: boolean;

  // Actions
  addMessage: (message: Message) => void;
  updateLastAssistantMessage: (update: Partial<Message>) => void;
  processStepEvent: (event: AgentStepEvent) => void;
  toggleDarkMode: () => void;
  toggleDebug: () => void;
  toggleSidebar: () => void;
  setHealthStatus: (vectorDbOnline: boolean, graphActive: boolean) => void;
  clearChat: () => void;
  setIsStreaming: (status: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  activeNode: null,
  subQueries: [],
  currentSubQueryIndex: 0,
  retrievalAttempts: 0,
  evaluatorFeedback: '',
  evaluationStatus: null,
  accumulatedSources: [],
  debugLogs: [],
  isStreaming: false,
  isDarkMode: true,
  isDebugOpen: false,
  isSidebarOpen: true,
  vectorDbOnline: true,
  graphActive: true,

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (update) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].sender === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], ...update };
      }
      return { messages };
    }),

  processStepEvent: (event) =>
    set((state) => {
      const newLogs = [
        ...state.debugLogs,
        { ...event, timestamp: new Date().toLocaleTimeString() },
      ];

      let newActiveNode = state.activeNode;
      let newSubQueries = state.subQueries;
      let newSources = [...state.accumulatedSources];
      let newEvalStatus = state.evaluationStatus;
      let newFeedback = state.evaluatorFeedback;
      let newAttempts = state.retrievalAttempts;
      let newIndex = state.currentSubQueryIndex;

      if (event.agent) {
        newActiveNode = event.agent;
      }

      if (event.type === 'SUB_QUERIES_GENERATED' && event.sub_queries) {
        newSubQueries = event.sub_queries;
      }

      if (event.type === 'RETRIEVAL_COMPLETE' && event.sources) {
        // Append new non-duplicate sources
        event.sources.forEach((src) => {
          if (!newSources.some((existing) => existing.page_content === src.page_content)) {
            newSources.push(src);
          }
        });
      }

      if (event.type === 'EVALUATION_STATUS') {
        newEvalStatus = event.evaluation_status || null;
        if (event.feedback) newFeedback = event.feedback;
        if (event.retrieval_attempts !== undefined) newAttempts = event.retrieval_attempts;
      }

      if (event.state_snapshot) {
        if (event.state_snapshot.current_sub_query_index !== undefined) {
          newIndex = event.state_snapshot.current_sub_query_index;
        }
      }

      // Update current streaming assistant message
      const messages = [...state.messages];
      const lastMsg = messages[messages.length - 1];

      if (lastMsg && lastMsg.sender === 'assistant') {
        const updatedSteps = [...(lastMsg.agentSteps || []), event];
        let updatedContent = lastMsg.content;

        if (event.type === 'FINAL_RESPONSE' && event.content) {
          updatedContent = event.content;
        }

        messages[messages.length - 1] = {
          ...lastMsg,
          content: updatedContent,
          sources: newSources,
          agentSteps: updatedSteps,
        };
      }

      return {
        debugLogs: newLogs,
        activeNode: newActiveNode,
        subQueries: newSubQueries,
        accumulatedSources: newSources,
        evaluationStatus: newEvalStatus,
        evaluatorFeedback: newFeedback,
        retrievalAttempts: newAttempts,
        currentSubQueryIndex: newIndex,
        messages,
      };
    }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleDebug: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setHealthStatus: (vectorDbOnline, graphActive) => set({ vectorDbOnline, graphActive }),

  clearChat: () =>
    set({
      messages: [],
      activeNode: null,
      subQueries: [],
      currentSubQueryIndex: 0,
      retrievalAttempts: 0,
      evaluatorFeedback: '',
      evaluationStatus: null,
      accumulatedSources: [],
      debugLogs: [],
      isStreaming: false,
    }),

  setIsStreaming: (status) => set({ isStreaming: status }),
}));

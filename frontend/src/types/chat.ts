export interface SourceChunk {
  page_content: string;
  metadata?: Record<string, any>;
  source_name?: string;
}

export type AgentNodeName =
  | 'supervisor'
  | 'research_agent'
  | 'retriever_agent'
  | 'evaluator_agent'
  | 'synthesizer_agent'
  | 'formatter_agent'
  | 'END';

export type EvaluationStatus = 'APPROVED' | 'RETRY' | null;

export interface StateSnapshot {
  current_sub_query?: string;
  sub_queries_list?: string[];
  current_sub_query_index?: number;
  retrieval_attempts?: number;
  evaluated_sufficiency?: boolean;
  evaluator_feedback?: string;
  next_agent_to_call?: string;
}

export interface AgentStepEvent {
  type:
    | 'AGENT_START'
    | 'NODE_UPDATE'
    | 'SUB_QUERIES_GENERATED'
    | 'RETRIEVAL_COMPLETE'
    | 'EVALUATION_STATUS'
    | 'SYNTHESIS_COMPLETE'
    | 'FINAL_RESPONSE'
    | 'WORKFLOW_COMPLETE'
    | 'ERROR';
  agent?: AgentNodeName | string;
  content?: string;
  sub_queries?: string[];
  sources?: SourceChunk[];
  evaluation_status?: EvaluationStatus;
  feedback?: string;
  retrieval_attempts?: number;
  state_snapshot?: StateSnapshot;
  timestamp?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceChunk[];
  agentSteps?: AgentStepEvent[];
  isStreaming?: boolean;
}

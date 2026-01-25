import { AgentType } from '@/lib/db/types/enums';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  agent: AgentType;
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface SpecialistConfig {
  name: string;
  agentType: AgentType;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SpecialistInput {
  task: string;
  context: TaskContext;
  previousResponses?: AgentResponse[];
}

export interface SpecialistOutput {
  response: AgentResponse;
  extractedData?: Record<string, any>;
  suggestedActions?: SuggestedAction[];
  flags?: string[];
}

export type TaskType = 
  | 'document_analysis'     
  | 'case_assignment'   
  | 'user_command'   
  | 'case_review'   
  | 'action_generation'; 

export interface TaskContext {
  taskType: TaskType;
  
  caseId?: string;
  caseNumber?: string;
  clientName?: string;
  caseType?: string;
  caseStatus?: string;
  caseSummary?: string;
  
  documentId?: string;
  documentTitle?: string;
  documentCategory?: string;
  documentText?: string;
  documentImages?: string[];
  
  userCommand?: string;
  
  recentActions?: string[];
  relatedDocuments?: Array<{
    title: string;
    category: string;
    summary?: string;
  }>;
  
  conversationHistory?: AgentMessage[];
}

export interface RoundTableConfig {
  maxRounds: number;     
  consensusThreshold: number;   
  temperature: number;    
  requireAllAgents: boolean; 
  timeoutMs: number; 
}

export interface RoundTableSession {
  sessionId: string;
  taskType: TaskType;
  context: TaskContext;
  config: RoundTableConfig;
  startedAt: Date;
  completedAt?: Date;
  rounds: RoundTableRound[];
  consensus?: RoundTableConsensus;
  actions: SuggestedAction[];
}

export interface RoundTableRound {
  roundNumber: number;
  responses: AgentResponse[];
  startedAt: Date;
  completedAt: Date;
}

export interface RoundTableConsensus {
  summary: string;
  keyFindings: string[];
  flags: string[];
  recommendations: string[];
  confidence: number;
  dissent?: string[];
}

export interface SuggestedAction {
  type: string;         
  title: string;
  description: string;
  priority: number;   
  confidence: number;  
  reasoning: string;
  content: Record<string, any>;
  suggestedBy: AgentType;
}

export interface OrchestratorInput {
  taskType: TaskType;
  context: TaskContext;
  config?: Partial<RoundTableConfig>;
}

export interface OrchestratorOutput {
  session: RoundTableSession;
  actions: SuggestedAction[];
  documentUpdates?: {
    summary?: string;
    keyFindings?: string[];
    flags?: string[];
    category?: string;
    metadata?: Record<string, any>;
  };
  errors?: string[];
}

export interface LLMProvider {
  name: string;
  generateResponse(
    messages: AgentMessage[],
    options?: LLMOptions
  ): Promise<LLMResponse>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}

export const DEFAULT_ROUND_TABLE_CONFIG: RoundTableConfig = {
  maxRounds: 3,
  consensusThreshold: 0.7,
  temperature: 0.7,
  requireAllAgents: true,
  timeoutMs: 30000,
};

export const DEFAULT_LLM_OPTIONS: LLMOptions = {
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 4096,
};

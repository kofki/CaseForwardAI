// lib/agents/types.ts
// ============================================================================
// AI Agent Types
// ============================================================================
// Shared types for the AI orchestration layer
// ============================================================================

import { AgentType } from '@/lib/db/types/enums';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

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

// ============================================================================
// SPECIALIST TYPES
// ============================================================================

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

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskType = 
  | 'document_analysis'      // Analyze a new document
  | 'case_assignment'        // Suggest case for unassigned doc
  | 'user_command'           // Process user instruction
  | 'case_review'            // Periodic case review
  | 'action_generation';     // Generate action recommendation

export interface TaskContext {
  // What triggered this task
  taskType: TaskType;
  
  // Case context (if known)
  caseId?: string;
  caseNumber?: string;
  clientName?: string;
  caseType?: string;
  caseStatus?: string;
  caseSummary?: string;
  
  // Document context (if applicable)
  documentId?: string;
  documentTitle?: string;
  documentCategory?: string;
  documentText?: string;
  documentImages?: string[];  // Base64 or URLs
  
  // User command (if applicable)
  userCommand?: string;
  
  // Additional context
  recentActions?: string[];
  relatedDocuments?: Array<{
    title: string;
    category: string;
    summary?: string;
  }>;
  
  // Conversation history (for multi-turn)
  conversationHistory?: AgentMessage[];
}

// ============================================================================
// ROUND TABLE TYPES
// ============================================================================

export interface RoundTableConfig {
  maxRounds: number;              // Max discussion iterations
  consensusThreshold: number;     // Agreement level needed (0-1)
  temperature: number;            // LLM temperature
  requireAllAgents: boolean;      // All must respond?
  timeoutMs: number;              // Max time per round
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
  dissent?: string[];  // Any disagreements
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export interface SuggestedAction {
  type: string;              // ActionType enum value
  title: string;
  description: string;
  priority: number;          // 1-4 (critical to low)
  confidence: number;        // 0-1
  reasoning: string;
  content: Record<string, any>;  // Type-specific content
  suggestedBy: AgentType;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

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

// ============================================================================
// LLM PROVIDER TYPES
// ============================================================================

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

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

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

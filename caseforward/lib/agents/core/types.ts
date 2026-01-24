
import { z } from 'zod';

// --- Roles ---
export type AgentRole = 'ORCHESTRATOR' | 'CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR';

export const ALL_ROLES: AgentRole[] = ['ORCHESTRATOR', 'CLIENT_GURU', 'EVIDENCE_ANALYZER', 'SETTLEMENT_VALUATOR'];

// --- Action Types ---
export type ActionType =
  | 'DRAFT_EMAIL'
  | 'DRAFT_SMS'
  | 'SCHEDULE_EVENT'
  | 'FLAG_CONTRADICTION'
  | 'REQUEST_DOCUMENTS'
  | 'NO_ACTION';

// --- The "Card" the user swipes ---
export interface ActionCard {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  metadata?: Record<string, any>; // e.g., { emailBody: "...", recipient: "..." }
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  originator: AgentRole;
}

// --- Round Table Chat State ---
export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
}

export interface RoundTableState {
  caseId: string;
  messages: AgentMessage[];
  status: 'DISCUSSING' | 'CONSENSUS_REACHED';
  currentSpeaker?: AgentRole;
  consensusCard?: ActionCard;
}

// --- Zod Schemas for LLM Output ---

export const ActionCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(['DRAFT_EMAIL', 'DRAFT_SMS', 'SCHEDULE_EVENT', 'FLAG_CONTRADICTION', 'REQUEST_DOCUMENTS', 'NO_ACTION']),
  metadata: z.object({
    emailBody: z.string().optional(),
    recipient: z.string().optional(),
    eventDate: z.string().optional(),
    documentRequested: z.string().optional(),
  }).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

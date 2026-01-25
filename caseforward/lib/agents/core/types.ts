import { z } from 'zod';

export type AgentRole = 'ORCHESTRATOR' | 'CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
}

export const ActionCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(['DRAFT_EMAIL', 'RISK_FLAG', 'SETTLEMENT_OFFER', 'MISSING_DOCS', 'GENERAL']),
  metadata: z.record(z.string(), z.any()).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

export type ActionCard = z.infer<typeof ActionCardSchema> & {
  id: string;
  originator: AgentRole;
};

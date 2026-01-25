import { z } from 'zod';

export type AgentRole = 'ORCHESTRATOR' | 'CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
}

export const ActionCardSchema = z.object({
  title: z.string().describe('Title of the recommended action'),
  description: z.string().describe('Detailed description of what should be done'),
  type: z.enum(['DRAFT_EMAIL', 'RISK_FLAG', 'SETTLEMENT_OFFER', 'MISSING_DOCS', 'GENERAL']).describe('Category of the action'),
  emailBody: z.string().optional().describe('If type is DRAFT_EMAIL, the email content to send'),
  missingDocuments: z.array(z.string()).optional().describe('If type is MISSING_DOCS, list of documents needed'),
  riskDetails: z.string().optional().describe('If type is RISK_FLAG, details about the risk'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 to 1'),
  reasoning: z.string().describe('Explanation of why this action is recommended'),
  metadata: z.any().optional().describe('Additional metadata for the action'),
});

export type ActionCard = z.infer<typeof ActionCardSchema> & {
  id: string;
  originator: AgentRole;
};

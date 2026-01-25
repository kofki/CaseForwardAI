import { z } from 'zod';
import { ActionType } from '../../db/types/enums';

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
    type: z.nativeEnum(ActionType).describe("The type of action to take"),
    confidence: z.number().min(0).max(100),
    reasoning: z.string(),
    metadata: z.record(z.any()).optional().describe("Additional data needed for the action (e.g. email draft, missing docs list)"),
});

export type ActionCard = z.infer<typeof ActionCardSchema> & {
    id: string;
    originator: AgentRole;
};

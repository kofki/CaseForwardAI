
import { AgentRole, AgentMessage, ActionCard } from './types';

export interface AgentContext {
    caseData: any; // TODO: Define strict Case schema later
    previousMessages: AgentMessage[];
}

export interface Specialist {
    role: AgentRole;
    description: string;

    /**
     * Phase 1: Initial Analysis
     * The agent looks at the new input and forms an initial opinion/thought.
     */
    opine(input: string, context: AgentContext): Promise<string>;

    /**
     * Phase 2: Discussion
     * The agent replies to the other agents' points.
     */
    reply(messageHistory: AgentMessage[], context: AgentContext): Promise<string>;
}


import { z } from 'zod';
import { AgentRole, AgentMessage, ActionCard, ActionCardSchema } from './core/types';
import { Specialist, AgentContext } from './core/specialist';
import { ClientGuru } from './specialists/client-guru';
import { EvidenceAnalyzer } from './specialists/evidence-analyzer';
import { SettlementValuator } from './specialists/settlement-valuator';
import { generateObject, generateText } from 'ai';
import { google } from './core/gemini';
import { randomUUID } from 'crypto';

export class RoundTable {
    private specialists: Record<AgentRole, Specialist>;
    private history: AgentMessage[] = [];

    constructor() {
        this.specialists = {
            CLIENT_GURU: new ClientGuru(),
            EVIDENCE_ANALYZER: new EvidenceAnalyzer(),
            SETTLEMENT_VALUATOR: new SettlementValuator(),
            ORCHESTRATOR: null as any, // Orchestrator logic is embedded in the table
        };
    }

    async discuss(input: string, caseContext: any): Promise<{ history: AgentMessage[], card: ActionCard }> {
        // 1. Orchestrator introduces the topic
        this.addMessage('ORCHESTRATOR', `New Input received: "${input}". Team, what are your thoughts?`);

        // 2. Initial Opinions (All specialists)
        const guruOpine = await this.specialists.CLIENT_GURU.opine(input, { caseData: caseContext, previousMessages: this.history });
        this.addMessage('CLIENT_GURU', guruOpine);

        const analyzerOpine = await this.specialists.EVIDENCE_ANALYZER.opine(input, { caseData: caseContext, previousMessages: this.history });
        this.addMessage('EVIDENCE_ANALYZER', analyzerOpine);

        const valuatorOpine = await this.specialists.SETTLEMENT_VALUATOR.opine(input, { caseData: caseContext, previousMessages: this.history });
        this.addMessage('SETTLEMENT_VALUATOR', valuatorOpine);

        // 3. Orchestrator Synthesis
        this.addMessage('ORCHESTRATOR', "Considering all perspectives, let's decide on an action.");

        // 4. Final Decision Card Generation
        type ActionCardOutput = z.infer<typeof ActionCardSchema>;
        const { object }: { object: ActionCardOutput } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: ActionCardSchema,
            prompt: `
        Analyze the following round-table discussion between legal AI specialists.
        
        Transcript:
        ${this.history.map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Based on this, generate a single Action Card for the attorney to review.
        - If the Client Guru is drafting an email, put the draft in metadata.emailBody
        - If the Evidence Analyzer flagged a risk or missing docs, put the warning in reasoning.
        - If the Settlement Valuator provided figures, include them in the reasoning.
      `
        });

        return {
            history: this.history,
            card: {
                id: randomUUID(),
                title: object.title,
                description: object.description,
                type: object.type as any,
                metadata: object.metadata,
                confidence: object.confidence,
                reasoning: object.reasoning,
                originator: 'ORCHESTRATOR'
            }
        };
    }

    private addMessage(role: AgentRole, content: string) {
        this.history.push({
            id: randomUUID(),
            role,
            content,
            timestamp: Date.now()
        });
    }
}

import { z } from 'zod';
import { AgentRole, AgentMessage, ActionCard, ActionCardSchema } from './core/types';
import { Specialist, AgentContext } from './core/specialist';
import { ClientGuru } from './specialists/client-guru';
import { EvidenceAnalyzer } from './specialists/evidence-analyzer';
import { SettlementValuator } from './specialists/settlement-valuator';
import { generateObject } from 'ai';
import { getGeminiModel } from './core/gemini';
import { randomUUID } from 'crypto';
import { fetchFullCaseContext, CaseContext, formatCaseContextForPrompt } from './services/case-context.service';

export class RoundTable {
  private specialists: Record<Exclude<AgentRole, 'ORCHESTRATOR'>, Specialist>;
  private history: AgentMessage[] = [];

  constructor() {
    this.specialists = {
      CLIENT_GURU: new ClientGuru(),
      EVIDENCE_ANALYZER: new EvidenceAnalyzer(),
      SETTLEMENT_VALUATOR: new SettlementValuator(),
    };
  }

  /**
   * Primary entry point for database-connected discussions.
   * Fetches full case context and runs the round table discussion.
   */
  async discussWithCase(caseId: string, input: string): Promise<{ history: AgentMessage[], card: ActionCard, caseContext: CaseContext }> {
    // Fetch full case context from database
    const caseContext = await fetchFullCaseContext(caseId);

    // Run discussion with real data
    const result = await this.discuss(input, caseContext);

    return {
      ...result,
      caseContext
    };
  }

  /**
   * Discussion logic with typed CaseContext
   */
  async discuss(input: string, caseContext: CaseContext): Promise<{ history: AgentMessage[], card: ActionCard }> {
    // Reset history for new discussion
    this.history = [];

    // Format context for orchestrator intro
    const contextSummary = formatCaseContextForPrompt(caseContext);

    // 1. Orchestrator introduces the topic with case context
    this.addMessage('ORCHESTRATOR', `New Input received for Case #${caseContext.caseNumber} (${caseContext.client.name}): "${input}"\n\nCase Context:\n${contextSummary}\n\nTeam, what are your thoughts?`);

    // Build agent context
    const agentContext: AgentContext = {
      caseData: caseContext,
      previousMessages: this.history
    };

    // 2. Initial Opinions (All specialists)
    const guruOpine = await this.specialists.CLIENT_GURU.opine(input, agentContext);
    this.addMessage('CLIENT_GURU', guruOpine);

    const analyzerOpine = await this.specialists.EVIDENCE_ANALYZER.opine(input, { ...agentContext, previousMessages: this.history });
    this.addMessage('EVIDENCE_ANALYZER', analyzerOpine);

    const valuatorOpine = await this.specialists.SETTLEMENT_VALUATOR.opine(input, { ...agentContext, previousMessages: this.history });
    this.addMessage('SETTLEMENT_VALUATOR', valuatorOpine);

    // 3. Orchestrator Synthesis (Implied step before generating final card)
    this.addMessage('ORCHESTRATOR', "Considering all perspectives, let's decide on an action.");

    // 4. Final Decision Card Generation
    // Using generateObject to force structured output for the Action Card
    const result = await generateObject({
      model: getGeminiModel('gemini-2.5-flash'), // Stronger model for synthesis
      schema: ActionCardSchema,
      prompt: `
        Analyze the following round-table discussion between legal AI specialists.
        
        Case: ${caseContext.caseNumber} | Client: ${caseContext.client.name} | Type: ${caseContext.caseType}
        
        Transcript:
        ${this.history.map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Based on this discussion AND the actual case data, generate a single Action Card for the attorney to review.
        - If the Client Guru is drafting an email, put the draft in metadata.emailBody
        - If the Evidence Analyzer flagged a risk or missing docs, put the warning in reasoning.
        - If the Settlement Valuator provided figures, include them in the reasoning.
        - Reference the client by name (${caseContext.client.name}) in any communications.
      `
    });

    const object = result.object;

    return {
      history: this.history,
      card: {
        id: randomUUID(),
        title: object.title,
        description: object.description,
        type: object.type,
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

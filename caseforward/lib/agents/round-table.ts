import { z } from 'zod';
import { AgentRole, AgentMessage, ActionCard, ActionCardSchema } from './core/types';
import { Specialist, AgentContext } from './core/specialist';
import { ClientGuru } from './specialists/client-guru';
import { EvidenceAnalyzer } from './specialists/evidence-analyzer';
import { SettlementValuator } from './specialists/settlement-valuator';
import { generateObject, generateText } from 'ai';
import { getGeminiModel } from './core/gemini';
import { randomUUID } from 'crypto';
import { fetchFullCaseContext, CaseContext, formatCaseContextForPrompt } from './services/case-context.service';
import { classifyIntent, IntentClassification, QueryIntent, IntentNeedsActionCard, generateQueryResponse } from './core/intent-classifier';
import connectDB from '@/lib/db/connect';

type SpecialistKey = 'CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR';

export interface RoundTableResult {
  history: AgentMessage[];
  card: ActionCard | null;
  caseContext: CaseContext;
  intent: IntentClassification;
  isQuery: boolean;
}

export class RoundTable {
  private specialists: Record<SpecialistKey, Specialist>;
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
   * Now with intent classification for smarter responses.
   */
  async discussWithCase(caseId: string, input: string): Promise<RoundTableResult> {
    await connectDB();

    // 1. Classify the user's intent first
    const intent = await classifyIntent(input);
    console.log('Intent classified:', intent);

    // 2. Fetch case context
    const caseContext = await fetchFullCaseContext(caseId);

    // 3. If it's a pure query, generate a direct response
    if (intent.isQuery) {
      const response = await generateQueryResponse(
        intent.intent as QueryIntent,
        input,
        caseContext
      );

      this.history = [{
        id: randomUUID(),
        role: 'ORCHESTRATOR',
        content: response,
        timestamp: Date.now()
      }];

      return {
        history: this.history,
        card: null,
        caseContext,
        intent,
        isQuery: true
      };
    }

    // 4. For action requests, run the focused discussion
    const result = await this.discussAction(input, caseContext, intent);

    return {
      ...result,
      caseContext,
      intent,
      isQuery: false
    };
  }

  /**
   * Focused discussion for action-type requests
   * Only calls relevant specialists based on intent
   */
  private async discussAction(
    input: string,
    caseContext: CaseContext,
    intent: IntentClassification
  ): Promise<{ history: AgentMessage[], card: ActionCard | null }> {
    this.history = [];

    const contextSummary = formatCaseContextForPrompt(caseContext);

    // Orchestrator introduces with focused context
    this.addMessage('ORCHESTRATOR',
      `Action request for Case #${caseContext.caseNumber} (${caseContext.client.name}):\n\n` +
      `"${input}"\n\n` +
      `Intent: ${intent.intent.replace('_', ' ').toUpperCase()}\n` +
      `Calling specialists: ${intent.suggestedSpecialists.join(', ')}`
    );

    const agentContext: AgentContext = {
      caseData: caseContext,
      previousMessages: this.history
    };

    // Only call relevant specialists
    for (const specialist of intent.suggestedSpecialists) {
      const spec = this.specialists[specialist as SpecialistKey];
      if (spec) {
        // Create focused prompt based on intent
        const focusedInput = this.createFocusedPrompt(input, intent, caseContext);
        const response = await spec.opine(focusedInput, {
          ...agentContext,
          previousMessages: this.history
        });
        this.addMessage(specialist as AgentRole, response);
      }
    }

    // Generate action card only if needed
    if (!IntentNeedsActionCard[intent.intent as QueryIntent]) {
      return { history: this.history, card: null };
    }

    // Synthesize action card
    const result = await generateObject({
      model: getGeminiModel('gemini-2.5-flash'),
      schema: ActionCardSchema,
      prompt: `
        Analyze this discussion for Case #${caseContext.caseNumber}:
        
        User Request: "${input}"
        Intent: ${intent.intent}
        
        Transcript:
        ${this.history.map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Generate an Action Card that directly addresses what the user asked for.
        
        IMPORTANT:
        - If intent is action_draft_email, the card MUST be type 'DRAFT_EMAIL' with emailBody
        - If intent is action_assess_risk, the card MUST be type 'RISK_FLAG'
        - Only include what was explicitly requested
        - Do NOT add extra recommendations unless asked
      `
    });

    return {
      history: this.history,
      card: {
        id: randomUUID(),
        title: result.object.title,
        description: result.object.description,
        type: result.object.type,
        emailBody: result.object.emailBody,
        missingDocuments: result.object.missingDocuments,
        riskDetails: result.object.riskDetails,
        confidence: result.object.confidence,
        reasoning: result.object.reasoning,
        originator: 'ORCHESTRATOR'
      }
    };
  }

  /**
   * Creates a focused prompt for specialists based on intent
   */
  private createFocusedPrompt(input: string, intent: IntentClassification, caseContext: CaseContext): string {
    switch (intent.intent) {
      case 'action_draft_email':
        return `TASK: Draft a professional email for: "${input}"\n\nClient: ${caseContext.client.name}\nContext: ${caseContext.caseType} case\n\nProvide ONLY the email draft, no other commentary.`;

      case 'action_assess_risk':
        return `TASK: Identify and assess risks in this case.\n\nUser request: "${input}"\n\nFocus ONLY on risk factors. Be concise.`;

      case 'action_calculate':
        return `TASK: Calculate settlement/damages value.\n\nUser request: "${input}"\n\nProvide factual calculations only.`;

      default:
        return input;
    }
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

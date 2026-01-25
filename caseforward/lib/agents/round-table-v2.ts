/**
 * Round Table v2 - Multi-Round AI Discussion Engine
 * 
 * This implements the "AI Round Table" concept where multiple specialist agents:
 * 1. Share initial opinions (Phase 1: Opening Statements)
 * 2. Challenge/respond to each other (Phase 2: Deliberation)
 * 3. Reach consensus or flag dissent (Phase 3: Consensus Building)
 * 4. Generate final action card (Phase 4: Decision)
 * 
 * The orchestrator moderates and synthesizes the discussion.
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { generateObject, generateText } from 'ai';
import { getGeminiModel } from './core/gemini';
import { AgentRole, AgentMessage, ActionCard, ActionCardSchema } from './core/types';
import { Specialist, AgentContext } from './core/specialist';
import { ClientGuru } from './specialists/client-guru';
import { EvidenceAnalyzer } from './specialists/evidence-analyzer';
import { SettlementValuator } from './specialists/settlement-valuator';
import { fetchFullCaseContext, CaseContext, formatCaseContextForPrompt } from './services/case-context.service';
import connectDB from '@/lib/db/connect';
import { Action, AuditLog } from '@/lib/db/models';
import { ActionType, ActionStatus, ActionPriority, AgentType, AuditEventType, SeverityLevel } from '@/lib/db/types/enums';

// ============================================
// Types & Schemas
// ============================================

export interface RoundTableConfig {
  maxRounds: number;           // Max discussion rounds (default: 3)
  consensusThreshold: number;  // Agreement level to stop early (0-1)
  requireAllAgents: boolean;   // Must all agents contribute
  persistActions: boolean;     // Save actions to MongoDB
  createAuditLog: boolean;     // Log the discussion for compliance
}

export const DEFAULT_CONFIG: RoundTableConfig = {
  maxRounds: 2,
  consensusThreshold: 0.8,
  requireAllAgents: true,
  persistActions: true,
  createAuditLog: true,
};

export interface ConsensusAnalysis {
  hasConsensus: boolean;
  agreementLevel: number;   // 0-1 scale
  sharedConclusions: string[];
  points_of_contention: string[];
  dissent: string[];
  recommendedAction: string;
}

const ConsensusSchema = z.object({
  hasConsensus: z.boolean(),
  agreementLevel: z.number().min(0).max(1),
  sharedConclusions: z.array(z.string()),
  points_of_contention: z.array(z.string()),
  dissent: z.array(z.string()),
  recommendedAction: z.string(),
});

export interface RoundTableSession {
  sessionId: string;
  caseId: string;
  trigger: string;
  startedAt: Date;
  completedAt?: Date;
  rounds: RoundTableRound[];
  consensus?: ConsensusAnalysis;
  actionCard?: ActionCard;
  persistedActionId?: string;
}

export interface RoundTableRound {
  roundNumber: number;
  phase: 'opening' | 'deliberation' | 'closing';
  messages: AgentMessage[];
  startedAt: Date;
  completedAt?: Date;
}

export interface RoundTableResult {
  session: RoundTableSession;
  actionCard: ActionCard;
  caseContext: CaseContext;
}

// ============================================
// Enhanced Round Table
// ============================================

export class RoundTableV2 {
  private specialists: Record<Exclude<AgentRole, 'ORCHESTRATOR'>, Specialist>;
  private config: RoundTableConfig;
  private session: RoundTableSession | null = null;

  constructor(config: Partial<RoundTableConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.specialists = {
      CLIENT_GURU: new ClientGuru(),
      EVIDENCE_ANALYZER: new EvidenceAnalyzer(),
      SETTLEMENT_VALUATOR: new SettlementValuator(),
    };
  }

  /**
   * Main entry point - runs full round table discussion
   */
  async discussCase(
    caseId: string,
    trigger: string,
    context?: { documentId?: string; documentText?: string }
  ): Promise<RoundTableResult> {
    await connectDB();

    // Initialize session
    this.session = {
      sessionId: randomUUID(),
      caseId,
      trigger,
      startedAt: new Date(),
      rounds: [],
    };

    // Fetch case context
    const caseContext = await fetchFullCaseContext(caseId);
    const agentContext: AgentContext = {
      caseData: caseContext,
      previousMessages: [],
    };

    console.log(`[RoundTable] Starting session ${this.session.sessionId} for case ${caseContext.caseNumber}`);

    // ========================================
    // Phase 1: Opening Statements
    // ========================================
    const openingRound = await this.runOpeningRound(trigger, agentContext, context);
    this.session.rounds.push(openingRound);

    // ========================================
    // Phase 2: Deliberation (Challenge/Respond)
    // ========================================
    let allMessages = [...openingRound.messages];

    for (let i = 1; i < this.config.maxRounds; i++) {
      // Check for early consensus
      const consensus = await this.analyzeConsensus(allMessages, caseContext);

      if (consensus.hasConsensus && consensus.agreementLevel >= this.config.consensusThreshold) {
        console.log(`[RoundTable] Early consensus reached (${(consensus.agreementLevel * 100).toFixed(0)}%)`);
        this.session.consensus = consensus;
        break;
      }

      // Run deliberation round
      const deliberationRound = await this.runDeliberationRound(
        i + 1,
        allMessages,
        agentContext,
        consensus.points_of_contention
      );
      this.session.rounds.push(deliberationRound);
      allMessages = [...allMessages, ...deliberationRound.messages];
    }

    // Final consensus check if not already done
    if (!this.session.consensus) {
      this.session.consensus = await this.analyzeConsensus(allMessages, caseContext);
    }

    // ========================================
    // Phase 3: Generate Action Card
    // ========================================
    const actionCard = await this.generateActionCard(allMessages, caseContext, context);
    this.session.actionCard = actionCard;
    this.session.completedAt = new Date();

    // ========================================
    // Phase 4: Persist to Database
    // ========================================
    if (this.config.persistActions) {
      const actionId = await this.persistAction(actionCard, caseId, allMessages, context?.documentId);
      this.session.persistedActionId = actionId;
    }

    if (this.config.createAuditLog) {
      await this.createAuditLog(caseId, allMessages);
    }

    console.log(`[RoundTable] Session complete. Action: ${actionCard.title}`);

    return {
      session: this.session,
      actionCard,
      caseContext,
    };
  }

  /**
   * Phase 1: Each agent shares their initial analysis
   */
  private async runOpeningRound(
    trigger: string,
    agentContext: AgentContext,
    context?: { documentText?: string }
  ): Promise<RoundTableRound> {
    const round: RoundTableRound = {
      roundNumber: 1,
      phase: 'opening',
      messages: [],
      startedAt: new Date(),
    };

    // Build enhanced input with document context if available
    const enhancedInput = context?.documentText
      ? `${trigger}\n\n--- Document Content ---\n${context.documentText.substring(0, 5000)}`
      : trigger;

    // Orchestrator opens
    round.messages.push(this.createMessage(
      'ORCHESTRATOR',
      `📋 New analysis requested for Case #${agentContext.caseData.caseNumber}:\n\n"${trigger}"\n\nTeam, please share your initial assessments.`
    ));

    // All specialists provide opening statements in parallel
    const [guruOpinion, analyzerOpinion, valuatorOpinion] = await Promise.all([
      this.specialists.CLIENT_GURU.opine(enhancedInput, {
        ...agentContext,
        previousMessages: round.messages,
      }),
      this.specialists.EVIDENCE_ANALYZER.opine(enhancedInput, {
        ...agentContext,
        previousMessages: round.messages,
      }),
      this.specialists.SETTLEMENT_VALUATOR.opine(enhancedInput, {
        ...agentContext,
        previousMessages: round.messages,
      }),
    ]);

    round.messages.push(this.createMessage('CLIENT_GURU', guruOpinion));
    round.messages.push(this.createMessage('EVIDENCE_ANALYZER', analyzerOpinion));
    round.messages.push(this.createMessage('SETTLEMENT_VALUATOR', valuatorOpinion));

    round.completedAt = new Date();
    return round;
  }

  /**
   * Phase 2: Agents challenge and respond to each other
   */
  private async runDeliberationRound(
    roundNumber: number,
    previousMessages: AgentMessage[],
    agentContext: AgentContext,
    contentionPoints: string[]
  ): Promise<RoundTableRound> {
    const round: RoundTableRound = {
      roundNumber,
      phase: 'deliberation',
      messages: [],
      startedAt: new Date(),
    };

    // Orchestrator frames the contention
    const contentionSummary = contentionPoints.length > 0
      ? `Points requiring resolution:\n${contentionPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : 'Please refine your positions based on what you\'ve heard.';

    round.messages.push(this.createMessage(
      'ORCHESTRATOR',
      `Round ${roundNumber}: Let's address the key points.\n\n${contentionSummary}\n\nPlease respond to your colleagues' analyses.`
    ));

    // Update context with all previous messages
    const updatedContext: AgentContext = {
      ...agentContext,
      previousMessages: [...previousMessages, ...round.messages],
    };

    // Specialists respond to each other (sequential for more natural flow)
    const guruReply = await this.specialists.CLIENT_GURU.reply(
      [...previousMessages, ...round.messages],
      updatedContext
    );
    round.messages.push(this.createMessage('CLIENT_GURU', guruReply));

    const analyzerReply = await this.specialists.EVIDENCE_ANALYZER.reply(
      [...previousMessages, ...round.messages],
      { ...updatedContext, previousMessages: [...updatedContext.previousMessages, round.messages[1]] }
    );
    round.messages.push(this.createMessage('EVIDENCE_ANALYZER', analyzerReply));

    const valuatorReply = await this.specialists.SETTLEMENT_VALUATOR.reply(
      [...previousMessages, ...round.messages],
      { ...updatedContext, previousMessages: [...updatedContext.previousMessages, round.messages[1], round.messages[2]] }
    );
    round.messages.push(this.createMessage('SETTLEMENT_VALUATOR', valuatorReply));

    round.completedAt = new Date();
    return round;
  }

  /**
   * Analyze the discussion for consensus
   */
  private async analyzeConsensus(
    messages: AgentMessage[],
    caseContext: CaseContext
  ): Promise<ConsensusAnalysis> {
    const transcript = messages
      .filter(m => m.role !== 'ORCHESTRATOR')
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    const result = await generateText({
      model: getGeminiModel('gemma-3-27b-it'),
      system: `You are analyzing a discussion between legal AI specialists about Case #${caseContext.caseNumber}.
Respond with a valid JSON object containing: hasConsensus (boolean), agreementLevel (number 0-1), sharedConclusions (string[]), points_of_contention (string[]), dissent (string[]), recommendedAction (string).`,
      prompt: `
TRANSCRIPT:
${transcript}

Analyze the discussion and determine:
1. Do the agents broadly agree on the next steps? (hasConsensus)
2. What's the agreement level? (0 = complete disagreement, 1 = full consensus)
3. What conclusions do they share? (sharedConclusions)
4. What specific points do they disagree on? (points_of_contention)
5. Are there any strong dissenting opinions? (dissent)
6. What action should be taken based on the majority view? (recommendedAction)

Be objective and specific. Output strictly valid JSON.
      `,
    });

    try {
      const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as ConsensusAnalysis;
    } catch (e) {
      console.error('Consensus JSON parse error', e);
      return { hasConsensus: false, agreementLevel: 0, sharedConclusions: [], points_of_contention: [], dissent: [], recommendedAction: 'Analysis failed' };
    }
  }

  /**
   * Generate the final action card based on discussion
   */
  private async generateActionCard(
    messages: AgentMessage[],
    caseContext: CaseContext,
    context?: { documentId?: string }
  ): Promise<ActionCard> {
    const transcript = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    const consensus = this.session?.consensus;
    const consensusSummary = consensus
      ? `
CONSENSUS ANALYSIS:
- Agreement Level: ${(consensus.agreementLevel * 100).toFixed(0)}%
- Shared Conclusions: ${consensus.sharedConclusions.join('; ')}
- Points of Contention: ${consensus.points_of_contention.join('; ') || 'None'}
- Recommended Action: ${consensus.recommendedAction}
      `
      : '';

    const result = await generateText({
      model: getGeminiModel('gemma-3-27b-it'),
      system: `You are the Orchestrator synthesizing a Round Table discussion into a single actionable recommendation.
Respond with a valid JSON object matching the detailed Action Card structure.`,
      prompt: `
CASE: ${caseContext.caseNumber} | Client: ${caseContext.client.name} | Type: ${caseContext.caseType}

DISCUSSION TRANSCRIPT:
${transcript}

${consensusSummary}

Generate ONE Action Card that represents the team's recommendation.
Output strictly JSON with keys: title, description, type (DRAFT_EMAIL/RISK_FLAG/SETTLEMENT_OFFER/MISSING_DOCS/GENERAL), emailBody (optional), missingDocuments (optional array), riskDetails (optional), confidence (0-1), reasoning, metadata (object).

RULES:
1. The title should be a clear action (e.g., "Request Missing Hospital Records")
2. If Client Guru drafted an email, include it in emailBody
3. Address the client by name (${caseContext.client.name}) in drafted communications.
      `,
    });

    let obj: any;
    try {
      const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      obj = JSON.parse(cleaned);
    } catch (e) {
      console.error('Action Card JSON parse error', e);
      // Fallback object
      obj = { title: 'Analysis Error', description: 'Could not generate card', type: 'GENERAL', confidence: 0, reasoning: 'JSON Error' };
    }

    return {
      id: randomUUID(),
      title: obj.title,
      description: obj.description,
      type: obj.type,
      metadata: {
        emailBody: obj.emailBody,
        missingDocuments: obj.missingDocuments,
        riskDetails: obj.riskDetails,
        ...obj.metadata,
        sessionId: this.session?.sessionId,
        roundsCompleted: this.session?.rounds.length,
        consensusLevel: consensus?.agreementLevel,
        documentId: context?.documentId,
      },
      confidence: obj.confidence,
      reasoning: obj.reasoning,
      originator: 'ORCHESTRATOR',
    };
  }

  /**
   * Persist the action to MongoDB for the swipe queue
   */
  private async persistAction(
    actionCard: ActionCard,
    caseId: string,
    messages: AgentMessage[],
    documentId?: string
  ): Promise<string> {
    // Map action card type to database ActionType
    const typeMap: Record<string, ActionType> = {
      'DRAFT_EMAIL': ActionType.SEND_EMAIL,
      'RISK_FLAG': ActionType.FLAG_FOR_REVIEW,
      'SETTLEMENT_OFFER': ActionType.GENERAL_RECOMMENDATION,
      'MISSING_DOCS': ActionType.REQUEST_DOCUMENT,
      'GENERAL': ActionType.GENERAL_RECOMMENDATION,
    };

    const action = await Action.create({
      caseId,
      documentId: documentId || undefined,
      type: typeMap[actionCard.type] || ActionType.GENERAL_RECOMMENDATION,
      status: ActionStatus.AWAITING_REVIEW,
      priority: actionCard.confidence >= 0.8 ? ActionPriority.HIGH : ActionPriority.MEDIUM,
      title: actionCard.title,
      description: actionCard.description,
      content: {
        email: actionCard.metadata?.emailBody ? {
          to: [actionCard.metadata.clientEmail],
          subject: actionCard.metadata.emailSubject || actionCard.title,
          body: actionCard.metadata.emailBody,
        } : undefined,
        recommendation: {
          title: actionCard.title,
          description: actionCard.description,
          suggestedActions: actionCard.metadata?.suggestedActions || [],
        },
        raw: actionCard.metadata,
      },
      aiContext: {
        reasoning: actionCard.reasoning,
        confidence: actionCard.confidence,
        agentType: AgentType.ORCHESTRATOR,
        supportingEvidence: this.session?.consensus?.sharedConclusions || [],
        roundTableSessionId: this.session?.sessionId,
      },
      actionCard: {
        recommendation: actionCard.description,
        reasoning: actionCard.reasoning,
        confidence: actionCard.confidence,
        type: actionCard.type,
        roundTableTranscript: messages.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500), // Truncate for storage
          timestamp: m.timestamp,
        })),
      },
    });

    console.log(`[RoundTable] Created Action ${action._id} for swipe queue`);
    return action._id.toString();
  }

  /**
   * Create audit log for compliance
   */
  private async createAuditLog(caseId: string, messages: AgentMessage[]): Promise<void> {
    await AuditLog.create({
      caseId,
      eventType: AuditEventType.ROUND_TABLE_COMPLETED,
      agentType: AgentType.ORCHESTRATOR,
      message: `Round Table discussion completed with ${messages.length} messages across ${this.session?.rounds.length} rounds`,
      success: true,
      details: {
        sessionId: this.session?.sessionId,
        trigger: this.session?.trigger,
        consensusLevel: this.session?.consensus?.agreementLevel,
        actionGenerated: this.session?.actionCard?.title,
        participatingAgents: ['CLIENT_GURU', 'EVIDENCE_ANALYZER', 'SETTLEMENT_VALUATOR'],
      },
      severity: SeverityLevel.INFO,
    });
  }

  /**
   * Helper to create a message
   */
  private createMessage(role: AgentRole, content: string): AgentMessage {
    return {
      id: randomUUID(),
      role,
      content,
      timestamp: Date.now(),
    };
  }
}

// ============================================
// Convenience Function
// ============================================

export async function runRoundTable(
  caseId: string,
  trigger: string,
  options?: {
    documentId?: string;
    documentText?: string;
    config?: Partial<RoundTableConfig>;
  }
): Promise<RoundTableResult> {
  const roundTable = new RoundTableV2(options?.config);
  return roundTable.discussCase(caseId, trigger, {
    documentId: options?.documentId,
    documentText: options?.documentText,
  });
}

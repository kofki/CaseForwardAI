/**
 * Round Table Service
 * 
 * High-level service that orchestrates:
 * 1. Database connection
 * 2. Case context fetching
 * 3. Round table discussion
 * 4. Action persistence with audit trail
 */

import mongoose from 'mongoose';
import { connectToDatabase } from '../../db/connect';
import Action, { IAction } from '../../db/models/Action';
import Case from '../../db/models/Case';
import AuditLog from '../../db/models/AuditLog';
import { RoundTable } from '../round-table';
import { ActionCard, AgentMessage } from '../core/types';
import { CaseContext } from './case-context.service';
import { randomUUID } from 'crypto';
import { ActionStatus, ActionPriority, InputSourceType, AuditEventType, Severity, ActionType } from '../../db/types/enums';

// Remove incorrect ACTION_TYPE_MAP since ActionCard type is already consistent with ActionType values

export interface RoundTableResult {
    actionId: string;
    card: ActionCard;
    history: AgentMessage[];
    caseContext: CaseContext;
}

/**
 * Run a round-table discussion for a case and persist the results
 */
export async function runRoundTableAndPersist(
    caseId: string,
    input: string,
    source: {
        type: InputSourceType;
        reference?: string;
    } = { type: InputSourceType.MANUAL }
): Promise<RoundTableResult> {
    await connectToDatabase();

    // Create audit trace ID for this flow
    const auditTraceId = randomUUID();

    // Log task received
    await logAuditEvent(auditTraceId, AuditEventType.TASK_RECEIVED, caseId, {
        input,
        source,
    });

    // Run round table discussion
    const roundTable = new RoundTable();
    const { history, card, caseContext } = await roundTable.discussWithCase(caseId, input);

    // Log round table discussion
    await logAuditEvent(auditTraceId, AuditEventType.ROUND_TABLE, caseId, {
        participantCount: history.length,
        consensusReached: true,
    });

    // Create Action from the card
    const action = await Action.create({
        caseId: new mongoose.Types.ObjectId(caseId),
        title: card.title,
        description: card.description,
        actionType: card.type,
        status: ActionStatus.AWAITING_REVIEW,
        priority: confidenceToPriority(card.confidence),
        source: {
            type: source.type,
            reference: source.reference,
            rawContent: input,
            triggeredAt: new Date(),
        },
        aiAnalysis: {
            evidenceFindings: {
                missingDocuments: caseContext.missingDocuments,
                flags: caseContext.aiFlags,
                keyFacts: extractKeyFacts(history),
            },
            clientCommunication: {
                draftType: card.type === ActionType.SEND_CLIENT_EMAIL ? 'email' : card.type === ActionType.SEND_CLIENT_TEXT ? 'text' : 'email',
                draftSubject: card.title,
                draftContent: card.metadata?.emailBody || card.description,
                tone: 'professional',
            },
            roundTable: {
                evidenceAnalyzerSays: extractAgentMessage(history, 'EVIDENCE_ANALYZER'),
                clientGuruSays: extractAgentMessage(history, 'CLIENT_GURU'),
                consensus: card.reasoning,
            },
            confidence: card.confidence,
        },
        auditTraceId,
    });

    // Log action created
    await logAuditEvent(auditTraceId, AuditEventType.ACTION_CREATED, caseId, {
        actionId: action._id.toString(),
        actionType: action.actionType,
        confidence: card.confidence,
    });

    // Update case AI metadata
    await Case.findByIdAndUpdate(caseId, {
        $set: { 'aiMetadata.lastAnalyzedAt': new Date() },
        $inc: { 'aiMetadata.pendingActions': 1 },
    });

    return {
        actionId: action._id.toString(),
        card,
        history,
        caseContext,
    };
}

/**
 * Convert confidence score to priority
 */
function confidenceToPriority(confidence: number): ActionPriority {
    if (confidence >= 0.9) return ActionPriority.LOW;
    if (confidence >= 0.7) return ActionPriority.MEDIUM;
    if (confidence >= 0.5) return ActionPriority.HIGH;
    return ActionPriority.CRITICAL;
}

/**
 * Extract key facts from history
 */
function extractKeyFacts(history: AgentMessage[]): string[] {
    const facts: string[] = [];
    for (const msg of history) {
        if (msg.role === 'EVIDENCE_ANALYZER' || msg.role === 'SETTLEMENT_VALUATOR') {
            // Extract bullet points or key sentences
            const lines = msg.content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
            facts.push(...lines.slice(0, 3).map(l => l.replace(/^[-•]\s*/, '').trim()));
        }
    }
    return facts.slice(0, 5);
}

/**
 * Extract message from a specific agent
 */
function extractAgentMessage(history: AgentMessage[], role: string): string {
    const msg = history.find(m => m.role === role);
    return msg?.content || '';
}

/**
 * Log an audit event
 */
async function logAuditEvent(
    traceId: string,
    eventType: AuditEventType,
    caseId: string,
    details: Record<string, any>
): Promise<void> {
    try {
        await AuditLog.create({
            traceId,
            spanId: randomUUID(),
            caseId: new mongoose.Types.ObjectId(caseId),
            agent: {
                type: 'orchestrator',
                version: '1.0.0',
            },
            event: {
                type: eventType,
                description: `Round table ${eventType}`,
                severity: Severity.INFO,
            },
            timing: {
                startedAt: new Date(),
            },
            result: {
                success: true,
                data: details,
            },
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}


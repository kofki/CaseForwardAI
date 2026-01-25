import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { getCaseByCaseNumber, getAllCases } from '@/lib/db/models/Case';
import { RoundTable } from '@/lib/agents/round-table';
import { generateText } from 'ai';
import { getGeminiModel } from '@/lib/agents/core/gemini';
import connectDB from '@/lib/db/connect';

/**
 * Debriefing Room API Endpoint
 * 
 * Enhanced chat endpoint that returns the full round table discussion
 * so the UI can display each specialist's contribution.
 */
export async function POST(request: NextRequest) {
    try {
        await requireAuth();
        await connectDB();

        const { userMessage } = await request.json();

        if (!userMessage || typeof userMessage !== 'string') {
            return NextResponse.json(
                { error: 'userMessage is required' },
                { status: 400 }
            );
        }

        // Try to extract case number from message (e.g., "CF-123456" or "CASE-2024-001")
        const caseNumberMatch = userMessage.match(/\b(CF-\d+|CASE-\d{4}-\d+)\b/i);

        if (caseNumberMatch) {
            const caseNumber = caseNumberMatch[1].toUpperCase();

            // Look up the case by case number
            const caseData = await getCaseByCaseNumber(caseNumber);

            if (caseData) {
                // Run the Round Table discussion with intent-aware processing
                const roundTable = new RoundTable();
                const result = await roundTable.discussWithCase(
                    caseData._id.toString(),
                    userMessage
                );

                return NextResponse.json({
                    success: true,
                    history: result.history,
                    actionCard: result.card, // Will be null for query-type intents
                    caseNumber: caseNumber,
                    intent: result.intent,
                    isQuery: result.isQuery,
                    caseContext: {
                        caseNumber: result.caseContext.caseNumber,
                        clientName: result.caseContext.client.name,
                        caseType: result.caseContext.caseType,
                        status: result.caseContext.status,
                    }
                });
            } else {
                return NextResponse.json({
                    success: true,
                    history: [{
                        id: 'error-1',
                        role: 'ORCHESTRATOR',
                        content: `I couldn't find a case with number "${caseNumber}". Please check the case number and try again, or ask a general question.`,
                        timestamp: Date.now()
                    }],
                    actionCard: null,
                    caseNumber: null
                });
            }
        }

        // No case number found - handle general query with specialists
        const generalResponse = await handleGeneralDebriefing(userMessage);

        return NextResponse.json(generalResponse);

    } catch (error: any) {
        console.error('Debriefing API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process debriefing request' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

/**
 * Handles general queries that don't reference a specific case
 * Still provides a round-table style response
 */
async function handleGeneralDebriefing(message: string): Promise<any> {
    try {
        // Check if user is asking about their cases
        const casesQueryPatterns = [
            /what cases/i,
            /my cases/i,
            /list.*cases/i,
            /show.*cases/i,
            /how many cases/i
        ];

        const isAskingAboutCases = casesQueryPatterns.some(p => p.test(message));

        if (isAskingAboutCases) {
            const cases = await getAllCases(10);
            if (cases && cases.length > 0) {
                const caseList = cases.map((c: any) =>
                    `• **${c.caseNumber}** — ${c.client?.firstName} ${c.client?.lastName || ''} (${c.status})`
                ).join('\n');

                return {
                    success: true,
                    history: [
                        {
                            id: 'orch-1',
                            role: 'ORCHESTRATOR',
                            content: `I found ${cases.length} cases in your system. Here's a summary:\n\n${caseList}\n\nWould you like me to analyze any specific case? Just include the case number in your next question.`,
                            timestamp: Date.now()
                        }
                    ],
                    actionCard: null,
                    caseNumber: null
                };
            } else {
                return {
                    success: true,
                    history: [
                        {
                            id: 'orch-1',
                            role: 'ORCHESTRATOR',
                            content: "You don't have any cases in the system yet. Create a new case to get started with AI analysis.",
                            timestamp: Date.now()
                        }
                    ],
                    actionCard: null,
                    caseNumber: null
                };
            }
        }

        // Use Gemini for general legal assistant responses
        const { text } = await generateText({
            model: getGeminiModel('gemini-2.5-flash-lite'),
            prompt: `You are the Orchestrator AI for a personal injury law firm's case management system called CaseForward.

User question: "${message}"

You are in a "Debriefing Room" where you lead discussions between AI specialists:
- Client Guru: Handles client communication and empathy
- Evidence Analyzer: Reviews documents and identifies gaps
- Settlement Valuator: Analyzes financial aspects

For this general question (no specific case), provide a helpful response as the Orchestrator.
If the user seems to be asking about a specific case but didn't include a case number, politely ask them to include the case number (format: CF-XXXXXX) so you can convene the specialists for a full analysis.

Keep your response concise and professional.`
        });

        return {
            success: true,
            history: [
                {
                    id: 'orch-1',
                    role: 'ORCHESTRATOR',
                    content: text,
                    timestamp: Date.now()
                }
            ],
            actionCard: null,
            caseNumber: null
        };
    } catch (error) {
        console.error('Error in general debriefing handler:', error);
        return {
            success: true,
            history: [
                {
                    id: 'error-1',
                    role: 'ORCHESTRATOR',
                    content: "I can help you with case-related questions. Please include a case number (like CF-123456) to get a full specialist analysis, or ask me about your cases in general.",
                    timestamp: Date.now()
                }
            ],
            actionCard: null,
            caseNumber: null
        };
    }
}

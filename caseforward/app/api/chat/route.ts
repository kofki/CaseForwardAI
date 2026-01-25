import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { getCaseByCaseNumber, getAllCases } from '@/lib/db/models/Case';
import { RoundTable } from '@/lib/agents/round-table';
import { generateText } from 'ai';
import { getGeminiModel } from '@/lib/agents/core/gemini';

/**
 * Smart Chat API Endpoint
 * 
 * Handles natural language queries about cases:
 * - Extracts case IDs/numbers from messages
 * - Routes to appropriate agent for case-specific queries
 * - Provides general responses when no case is specified
 */
export async function POST(request: NextRequest) {
    try {
        await requireAuth();
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
                // Run the full Round Table discussion for case-specific queries
                const roundTable = new RoundTable();
                const result = await roundTable.discussWithCase(
                    caseData._id.toString(),
                    userMessage
                );

                // Format response for chatbot
                const formattedResponse = formatRoundTableResponse(result);

                return NextResponse.json({
                    success: true,
                    response: formattedResponse,
                    actionCard: result.card,
                    caseNumber: caseNumber,
                    isRoundTable: true
                });
            } else {
                return NextResponse.json({
                    success: true,
                    response: `I couldn't find a case with number "${caseNumber}". Please check the case number and try again.`,
                    isRoundTable: false
                });
            }
        }

        // No case number found - provide a general response
        const generalResponse = await handleGeneralQuery(userMessage);

        return NextResponse.json({
            success: true,
            response: generalResponse,
            isRoundTable: false
        });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat message' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

/**
 * Formats the Round Table discussion result into a readable response
 */
function formatRoundTableResponse(result: {
    history: Array<{ role: string; content: string }>;
    card: any;
    caseContext: any
}): string {
    const parts: string[] = [];

    // Add case context summary
    const ctx = result.caseContext;
    parts.push(`**Case #${ctx.caseNumber}** — ${ctx.client.name} (${ctx.caseType})`);
    parts.push('');

    // Add key action card info
    if (result.card) {
        parts.push(`### 📋 Recommended Action: ${result.card.title}`);
        parts.push(result.card.description);
        parts.push('');
        parts.push(`**Confidence:** ${Math.round(result.card.confidence * 100)}%`);
        parts.push(`**Type:** ${result.card.type}`);

        if (result.card.reasoning) {
            parts.push('');
            parts.push(`**Reasoning:** ${result.card.reasoning}`);
        }
    }

    // Mention missing documents if any
    if (ctx.missingDocuments && ctx.missingDocuments.length > 0) {
        parts.push('');
        parts.push(`⚠️ **Missing Documents:** ${ctx.missingDocuments.join(', ')}`);
    }

    return parts.join('\n');
}

/**
 * Handles general queries that don't reference a specific case
 */
async function handleGeneralQuery(message: string): Promise<string> {
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
            const cases = await getAllCases();
            if (cases && cases.length > 0) {
                const caseList = cases.slice(0, 5).map((c: any) =>
                    `• **${c.caseNumber}** — ${c.client?.name || 'Unknown'} (${c.status})`
                ).join('\n');

                return `Here are your cases:\n\n${caseList}\n\nTo ask about a specific case, include the case number in your message (e.g., "What's the status of CF-123456?")`;
            } else {
                return "You don't have any cases yet. Create a new case to get started.";
            }
        }

        // Use Gemini for general legal assistant responses
        const { text } = await generateText({
            model: getGeminiModel('gemini-2.5-flash-lite'),
            prompt: `You are a helpful AI assistant for a personal injury law firm's case management system called CaseForward.

User question: "${message}"

Provide a helpful response. If the user seems to be asking about a specific case but didn't include a case number, politely ask them to include the case number (format: CF-XXXXXX or CASE-YYYY-XXX) so you can provide accurate information.

Keep responses concise and professional.`
        });

        return text;
    } catch (error) {
        console.error('Error in general query handler:', error);
        return "I can help you with case-related questions. Please include a case number (like CF-123456) to get specific information, or ask me about your cases in general.";
    }
}

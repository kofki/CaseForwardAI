import { z } from 'zod';
import { generateObject, generateText } from 'ai';
import { getGeminiModel } from './gemini';

/**
 * Query Intent Classification
 * 
 * Before routing to specialists, the orchestrator classifies the user's intent
 * to determine the appropriate response type.
 */

export enum QueryIntent {
    // User wants to retrieve/view information (no action needed)
    QUERY_DOCUMENTS = 'query_documents',      // "What documents do we have?"
    QUERY_STATUS = 'query_status',            // "What's the status of this case?"
    QUERY_FINANCIALS = 'query_financials',    // "What are the medical bills?"
    QUERY_GENERAL = 'query_general',          // General information request

    // User wants an action to be performed
    ACTION_DRAFT_EMAIL = 'action_draft_email',     // "Draft an email to the client"
    ACTION_DRAFT_LETTER = 'action_draft_letter',   // "Write a demand letter"
    ACTION_ASSESS_RISK = 'action_assess_risk',     // "Assess the risks in this case"
    ACTION_CALCULATE = 'action_calculate',         // "Calculate settlement value"
    ACTION_RECOMMEND = 'action_recommend',         // "What should we do next?"

    // Unclear - needs clarification
    UNCLEAR = 'unclear'
}

// Which specialists are relevant for each intent
export const IntentSpecialists: Record<QueryIntent, ('CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR')[]> = {
    [QueryIntent.QUERY_DOCUMENTS]: ['EVIDENCE_ANALYZER'],
    [QueryIntent.QUERY_STATUS]: ['EVIDENCE_ANALYZER'],
    [QueryIntent.QUERY_FINANCIALS]: ['SETTLEMENT_VALUATOR'],
    [QueryIntent.QUERY_GENERAL]: ['EVIDENCE_ANALYZER'],

    [QueryIntent.ACTION_DRAFT_EMAIL]: ['CLIENT_GURU'],
    [QueryIntent.ACTION_DRAFT_LETTER]: ['CLIENT_GURU', 'SETTLEMENT_VALUATOR'],
    [QueryIntent.ACTION_ASSESS_RISK]: ['EVIDENCE_ANALYZER', 'SETTLEMENT_VALUATOR'],
    [QueryIntent.ACTION_CALCULATE]: ['SETTLEMENT_VALUATOR', 'EVIDENCE_ANALYZER'],
    [QueryIntent.ACTION_RECOMMEND]: ['CLIENT_GURU', 'EVIDENCE_ANALYZER', 'SETTLEMENT_VALUATOR'],

    [QueryIntent.UNCLEAR]: ['EVIDENCE_ANALYZER'],
};

// Whether an action card should be generated
export const IntentNeedsActionCard: Record<QueryIntent, boolean> = {
    [QueryIntent.QUERY_DOCUMENTS]: false,
    [QueryIntent.QUERY_STATUS]: false,
    [QueryIntent.QUERY_FINANCIALS]: false,
    [QueryIntent.QUERY_GENERAL]: false,

    [QueryIntent.ACTION_DRAFT_EMAIL]: true,
    [QueryIntent.ACTION_DRAFT_LETTER]: true,
    [QueryIntent.ACTION_ASSESS_RISK]: true,
    [QueryIntent.ACTION_CALCULATE]: true,
    [QueryIntent.ACTION_RECOMMEND]: true,

    [QueryIntent.UNCLEAR]: false,
};

const IntentSchema = z.object({
    intent: z.enum([
        'query_documents',
        'query_status',
        'query_financials',
        'query_general',
        'action_draft_email',
        'action_draft_letter',
        'action_assess_risk',
        'action_calculate',
        'action_recommend',
        'unclear'
    ]).describe('The classified intent of the user query'),
    confidence: z.number().min(0).max(1).describe('Confidence in the classification'),
    reasoning: z.string().describe('Brief explanation of why this intent was chosen'),
    isQuery: z.boolean().describe('True if user just wants information, false if they want an action performed'),
    suggestedSpecialists: z.array(z.enum([
        'CLIENT_GURU',
        'EVIDENCE_ANALYZER',
        'SETTLEMENT_VALUATOR'
    ])).describe('Which specialists should be consulted'),
});

export type IntentClassification = z.infer<typeof IntentSchema>;

/**
 * Classifies the user's query intent to determine response strategy
 */
export async function classifyIntent(userQuery: string): Promise<IntentClassification> {
    try {
        const result = await generateText({
            model: getGeminiModel('gemma-3-4b-it'),
            system: 'You are an intent classifier for a legal case management AI system. Respond with valid JSON only.',
            prompt: `Analyze this user query and classify their intent:
"${userQuery}"

**QUERY intents** (user just wants information - NO action needed):
- query_documents: User wants to find, list, or see documents (e.g., "what documents do we have?", "find evidence", "show me the medical records")
- query_status: User asks about case status or progress
- query_financials: User asks about money, bills, damages, settlement amounts
- query_general: Other information requests

**ACTION intents** (user wants something done):
- action_draft_email: Explicitly asks to draft/write an email or message to someone
- action_draft_letter: Asks to draft a formal letter (demand letter, etc.)
- action_assess_risk: Asks for risk assessment or case evaluation
- action_calculate: Asks to calculate settlement or damages
- action_recommend: Asks "what should we do?" or wants recommendations

IMPORTANT: 
- "Help me find documents" = query_documents (NOT an action)
- "What evidence do we have?" = query_documents (NOT an action) 
- "Draft an email to the client" = action_draft_email (IS an action)
- Only classify as ACTION if user explicitly requests something to be created/done

The key difference: QUERY = show/find/list information. ACTION = create/draft/build something.

Output strictly JSON with keys: intent (string), confidence (number), reasoning (string), isQuery (boolean), suggestedSpecialists (array of strings).`
        });

        const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Intent classification failed:', error);
        // Default to general query
        return {
            intent: 'query_general',
            confidence: 0.5,
            reasoning: 'Failed to classify, defaulting to general query',
            isQuery: true,
            suggestedSpecialists: ['EVIDENCE_ANALYZER']
        };
    }
}

/**
 * Generates a direct response for query-type intents (no action card)
 */
export async function generateQueryResponse(
    intent: QueryIntent,
    userQuery: string,
    caseContext: any
): Promise<string> {
    // Build document context with actual content for searching
    let documentContext = 'No documents uploaded yet.';
    if (caseContext.documents && caseContext.documents.length > 0) {
        const docSummaries = caseContext.documents.map((d: any, idx: number) => {
            let entry = `${idx + 1}. **${d.title}** (${d.category}) [${d.status}]`;
            if (d.summary) {
                entry += `\n   Summary: ${d.summary}`;
            }
            // Include text content for AI to search (truncated to avoid token limits)
            if (d.textContent && d.textContent.length > 0) {
                const preview = d.textContent.substring(0, 2000);
                entry += `\n   Content Preview:\n   ${preview}${d.textContent.length > 2000 ? '...(truncated)' : ''}`;
            }
            return entry;
        }).join('\n\n');
        documentContext = docSummaries;
    }

    const { text } = await generateText({
        model: getGeminiModel('gemma-3-27b-it'),
        prompt: `You are a legal case management AI assistant. The user is asking for information.

User Query: "${userQuery}"

**Case Information:**
- Case Number: ${caseContext.caseNumber}
- Client: ${caseContext.client?.name}
- Case Type: ${caseContext.caseType}
- Status: ${caseContext.status}

**Incident Details:**
- Date: ${caseContext.incident?.date ? new Date(caseContext.incident.date).toLocaleDateString() : 'Unknown'}
- Location: ${caseContext.incident?.location || 'Unknown'}
- Description: ${caseContext.incident?.description || 'Not provided'}

**Documents on File (${caseContext.documents?.length || 0}):**
${documentContext}

**Missing Documents:** ${caseContext.missingDocuments?.join(', ') || 'None identified'}

**Financials:**
- Medical Bills: $${caseContext.financials?.totalMedicalBills?.toLocaleString() || 0}
- Lost Wages: $${caseContext.financials?.lostWages?.toLocaleString() || 0}

---

**Instructions:**
1. This is an INFORMATION REQUEST - the user wants to FIND or SEE data
2. Search through the documents and case data to answer their question
3. If asking about the accident, look for intake forms, incident reports, transcripts
4. Quote relevant excerpts from documents when available
5. Be direct and factual - don't suggest actions or draft emails
6. If the information isn't in the documents, say so clearly`
    });

    return text;
}


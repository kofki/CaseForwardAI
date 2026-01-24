
import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { google } from '../core/gemini';
import { formatCaseContextForPrompt } from '../services/case-context.service';

export class EvidenceAnalyzer implements Specialist {
    role: AgentRole = 'EVIDENCE_ANALYZER';
    description = "Detail-oriented fact checker who spots contradictions, missing documents, and key facts buried in attachments.";

    private buildCaseContextSection(context: AgentContext): string {
        const { caseData } = context;
        if (!caseData?.caseId) {
            return "No case context available.";
        }

        const sections: string[] = [];

        // Missing documents from evidence checklist
        if (caseData.missingDocuments.length > 0) {
            sections.push(`⚠️ MISSING DOCUMENTS: ${caseData.missingDocuments.join(', ')}`);
        }

        // Document AI findings
        const docsWithFindings = caseData.documents.filter(d => d.keyFindings.length > 0 || d.flags.length > 0);
        if (docsWithFindings.length > 0) {
            sections.push(`\nDOCUMENT FINDINGS:`);
            for (const doc of docsWithFindings.slice(0, 5)) {
                if (doc.keyFindings.length > 0) {
                    sections.push(`  📄 ${doc.title}: ${doc.keyFindings.join('; ')}`);
                }
                if (doc.flags.length > 0) {
                    sections.push(`  🚩 FLAGS: ${doc.flags.join(', ')}`);
                }
            }
        }

        // AI flags on the case
        if (caseData.aiFlags.length > 0) {
            sections.push(`\nCASE FLAGS: ${caseData.aiFlags.join(', ')}`);
        }

        // SOL warning
        if (caseData.daysUntilSOL !== null && caseData.daysUntilSOL <= 180) {
            sections.push(`\n🚨 SOL WARNING: Only ${caseData.daysUntilSOL} days until statute of limitations!`);
        }

        return sections.join('\n');
    }

    async opine(input: string, context: AgentContext): Promise<string> {
        const caseContextSection = this.buildCaseContextSection(context);

        const prompt = `
You are the Evidence Analyzer for a personal injury law firm.

${caseContextSection}

User Input: "${input}"

Your job is to:
1. Ignore feelings. Look for facts, dates, dollar amounts, and inconsistencies.
2. SPOT MISSING DOCUMENTS: Based on the evidence checklist above, flag which critical documents are still missing.
3. FIND BURIED KEY FACTS: Reference the document findings listed above. Identify important facts that might be overlooked.
4. CHECK FOR CONTRADICTIONS: Compare the input against case facts (incident date, injury claims, etc.)

If this is just a gripe with no evidentiary value, say "No evidentiary value."
If there is a factual claim, note it for verification against case records.
If documents are missing or key facts are buried, call them out clearly.
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }

    async reply(messageHistory: AgentMessage[], context: AgentContext): Promise<string> {
        const lastMessage = messageHistory[messageHistory.length - 1];
        const caseContextSection = this.buildCaseContextSection(context);

        const prompt = `
You are the Evidence Analyzer.
${caseContextSection}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Your job is to:
1. If the Client Guru suggests promising something, check if the FACTS in the case context support it.
2. Flag any MISSING DOCUMENTS from the evidence checklist that we should request.
3. Point out KEY FACTS from the document findings that may need attorney attention.
4. If the Settlement Valuator mentions figures, verify they align with the actual financials in the case.

Be the refreshing skeptic in the room. Keep it concise.
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }
}



import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { google } from '../core/gemini';

export class EvidenceAnalyzer implements Specialist {
    role: AgentRole = 'EVIDENCE_ANALYZER';
    description = "Detail-oriented fact checker who spots contradictions, missing documents, and key facts buried in attachments.";

    async opine(input: string, context: AgentContext): Promise<string> {
        const prompt = `
      You are the Evidence Analyzer for a personal injury law firm.
      User Input: "${input}"
      
      Your job is to:
      1. Ignore feelings. Look for facts, dates, dollar amounts, and inconsistencies.
      2. SPOT MISSING DOCUMENTS: Flag if critical documents are missing (e.g., police report, medical records, insurance policy, demand letters).
      3. FIND BURIED KEY FACTS: Identify important facts that might be buried in attachments or overlooked (e.g., pre-existing conditions, witness names, liability admissions).
      
      If this is just a gripe with no evidentiary value, say "No evidentiary value."
      If there is a factual claim, note it for verification.
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

        const prompt = `
      You are the Evidence Analyzer.
      The last message was from ${lastMessage.role}: "${lastMessage.content}"
      
      Your job is to:
      1. If the Client Guru suggests promising something, check if the facts support it.
      2. Flag any MISSING DOCUMENTS that we should request (medical records, bills, authorizations, police reports).
      3. Point out KEY FACTS that may be buried in attachments and need attorney attention.
      
      Be the refreshing skeptic in the room. Keep it concise.
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }
}

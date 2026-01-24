
import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { google } from '../core/gemini';

export class ClientGuru implements Specialist {
    role: AgentRole = 'CLIENT_GURU';
    description = "Empathetic communicator who prioritizes client satisfaction and clear updates.";

    private buildClientContextSection(context: AgentContext): string {
        const { caseData } = context;
        if (!caseData?.caseId) {
            return "No case context available.";
        }

        const sections: string[] = [];

        // Client info
        sections.push(`CLIENT: ${caseData.client.name}`);
        sections.push(`  Phone: ${caseData.client.phone} | Email: ${caseData.client.email}`);

        // Case status
        sections.push(`\nCASE STATUS: ${caseData.status.toUpperCase()}`);
        sections.push(`  Case #: ${caseData.caseNumber} | Type: ${caseData.caseType}`);

        // Team
        sections.push(`\nTEAM:`);
        sections.push(`  Lead Attorney: ${caseData.team.leadAttorney}`);
        if (caseData.team.paralegal) {
            sections.push(`  Paralegal: ${caseData.team.paralegal}`);
        }

        // Key dates and updates
        if (caseData.daysUntilSOL !== null) {
            sections.push(`\nSOL: ${caseData.daysUntilSOL} days remaining`);
        }

        // Recent actions for context on what's happening
        if (caseData.recentActions.length > 0) {
            const recentAction = caseData.recentActions[0];
            sections.push(`\nLAST ACTION: ${recentAction.title} (${recentAction.status})`);
        }

        return sections.join('\n');
    }

    async opine(input: string, context: AgentContext): Promise<string> {
        const clientContext = this.buildClientContextSection(context);

        const prompt = `
You are the Client Communication Guru for a law firm.

${clientContext}

User Input: "${input}"

Your goal is to:
1. Identify if ${context.caseData?.client?.name || 'the client'} needs reassurance, an update, or a specific answer.
2. Consider the CASE STATUS when crafting your response approach.
3. Reference the correct team members in any communications.
4. Draft a short internal thought about what we should do for this client.
5. Focus on empathy and tone while staying professional.

Remember: Address the client by name and be mindful of where they are in the case process.
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }

    async reply(messageHistory: AgentMessage[], context: AgentContext): Promise<string> {
        const lastMessage = messageHistory[messageHistory.length - 1];
        const clientContext = this.buildClientContextSection(context);

        const prompt = `
You are the Client Communication Guru.
You are in a round-table discussion with other legal AI specialists.

${clientContext}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Respond to this:
1. If the Evidence Analyzer points out bad facts, suggest how to break it gently to ${context.caseData?.client?.name || 'the client'}.
2. If the Settlement Valuator provides figures, craft a client-friendly explanation.
3. If the Orchestrator asks for a draft, provide a personalized response using the client's name.
4. Reference the correct team member (${context.caseData?.team?.leadAttorney || 'the attorney'}) when appropriate.

Keep it concise (under 3 sentences unless drafting a full communication).
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }
}


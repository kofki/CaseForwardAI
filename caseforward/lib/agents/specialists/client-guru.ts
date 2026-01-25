
import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { google } from '../core/gemini';

export class ClientGuru implements Specialist {
    role: AgentRole = 'CLIENT_GURU';
    description = "Empathetic communicator who prioritizes client satisfaction and clear updates.";

    async opine(input: string, context: AgentContext): Promise<string> {
        const prompt = `
      You are the Client Communication Guru for a law firm.
      User Input: "${input}"
      
      Your goal is to identify if the client needs reassurance, an update, or a specific answer.
      Draft a short internal thought about what we should do for this client.
      Focus on empathy and tone.
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
      You are the Client Communication Guru.
      You are in a round-table discussion with other legal AI specialists.
      
      The last message was from ${lastMessage.role}: "${lastMessage.content}"
      
      Respond to this. If the Evidence Analyzer points out bad facts, suggest how to break it gently to the client.
      If the Orchestrator asks for a draft, provide a drafted response.
      Keep it concise (under 3 sentences unless drafting).
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'), // User requested Gemini
            prompt: prompt,
        });

        return text;
    }
}


import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { getGeminiModel } from '../core/gemini';
import { formatCaseContextForPrompt } from '../services/case-context.service';

export class ClientGuru implements Specialist {
  role: AgentRole = 'CLIENT_GURU';
  description = "The empathy engine. Drafts clear, professional, and compassionate communications to clients, explaining complex legal situations in plain English.";

  async opine(input: string, context: AgentContext): Promise<string> {
    const caseSummary = formatCaseContextForPrompt(context.caseData);

    const prompt = `
You are the Client Guru for a personal injury law firm. Your goal is to manage client expectations and provide clear, empathetic updates.
${caseSummary}

User Input: "${input}"

Your task:
1. Analyze the situation from the CLIENT'S perspective.
2. Draft a potential response or proactive update (email or text).
3. Identify if we need more info from the client.
4. Maintain a professional but warm tone.

Output your thoughts on what we should communicate to the client and why.
`;

    const { text } = await generateText({
      model: getGeminiModel('gemini-2.5-flash-lite'),
      prompt: prompt,
    });

    return text;
  }

  async reply(messageHistory: AgentMessage[], context: AgentContext): Promise<string> {
    const lastMessage = messageHistory[messageHistory.length - 1];
    const caseSummary = formatCaseContextForPrompt(context.caseData);

    const prompt = `
You are the Client Guru.
${caseSummary}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Review the discussion so far.
- If the Evidence Analyzer found missing docs, how do we ask the client for them without overwhelming them?
- If the Settlement Valuator gave a low number, how do we prepare the client?
- If the plan is aggressive, how do we reassure the client?

Provide your input on how to frame the next communication with the client.
`;

    const { text } = await generateText({
      model: getGeminiModel('gemini-2.5-flash-lite'),
      prompt: prompt,
    });

    return text;
  }
}

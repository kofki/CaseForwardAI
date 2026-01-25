import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { getGeminiModel } from '../core/gemini';
import { formatCaseContextForPrompt } from '../services/case-context.service';

export class EvidenceAnalyzer implements Specialist {
  role: AgentRole = 'EVIDENCE_ANALYZER';
  description = "The rigorous fact-checker. Analyzes documents, identifies gaps in evidence, flags contradictions, and ensures the case foundation is solid.";

  async opine(input: string, context: AgentContext): Promise<string> {
    const caseSummary = formatCaseContextForPrompt(context.caseData);

    const prompt = `
You are the Evidence Analyzer for a personal injury law firm. Your job is to be skeptical, thorough, and fact-focused.
${caseSummary}

User Input: "${input}"

Your task:
1. Identify any MISSING critical documents based on the case type.
2. Flag any CONTRADICTIONS between client statements and police/medical records.
3. Highlight KEY FACTS that support or weaken the liability/damages arguments.
4. Ignore emotion; focus on what can be proven.

Output your analysis of the evidentiary state of the case.
`;

    const { text } = await generateText({
      model: getGeminiModel('gemma-3-12b-it'),
      prompt: prompt,
    });

    return text;
  }

  async reply(messageHistory: AgentMessage[], context: AgentContext): Promise<string> {
    const lastMessage = messageHistory[messageHistory.length - 1];
    const caseSummary = formatCaseContextForPrompt(context.caseData);

    const prompt = `
You are the Evidence Analyzer.
${caseSummary}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Review the discussion so far.
- If the Client Guru proposes a statement, is it backed by evidence?
- If the Settlement Valuator generates a number, are the underlying medical bills/records actually present?
- Are we making assumptions? Call them out.

Provide your objective analysis of the proposed plan.
`;

    const { text } = await generateText({
      model: getGeminiModel('gemini-2.5-flash-lite'),
      prompt: prompt,
    });

    return text;
  }
}


import { Specialist, AgentContext } from '../core/specialist';
import { AgentRole, AgentMessage } from '../core/types';
import { generateText } from 'ai';
import { google } from '../core/gemini';
import { LIEN_KNOWLEDGE } from '../knowledge/lien-knowledge';

export class SettlementValuator implements Specialist {
    role: AgentRole = 'SETTLEMENT_VALUATOR';
    description = "The Actuary/Librarian hybrid. Organizes medical records, bills, and authorizations while calculating case value with lien-aware net recovery analysis.";

    private getLienKnowledgePrompt(): string {
        return `
VALUATION KNOWLEDGE BASE:
${JSON.stringify(LIEN_KNOWLEDGE, null, 2)}

VALUATION METHODOLOGY:
1. Start with BASE DAMAGES (medical specials + lost wages)
2. Apply NON-ECONOMIC MULTIPLIER based on injury severity (minor: 1.5-3x, moderate: 3-5x, severe: 5-10x, permanent: 10-20x)
3. Apply MODIFIERS:
   - Liability strength: clear (1.0x), mixed (0.7x), weak (0.4x)
   - Objective injury evidence: none (0.8x), some (1.0x), strong (1.2x)
   - Treatment gaps: none (1.0x), moderate (0.85x), large (0.7x)
4. Apply POLICY CAP if limits are known (cannot recover more than policy limits)
5. Calculate NET TO CLIENT:
   - Subtract attorney fees (33-40%)
   - Subtract case costs ($2k-$10k)
   - Subtract liens based on severity (mandatory_high: 35%, medium: 20%, low: 10%)
`;
    }

    async opine(input: string, context: AgentContext): Promise<string> {
        const prompt = `
You are the Settlement Valuator (Records Wrangler) for a personal injury law firm.
${this.getLienKnowledgePrompt()}

User Input: "${input}"

ANALYZE AND ESTIMATE:
1. IDENTIFY DAMAGES: Medical bills, lost wages mentioned
2. ASSESS LIABILITY: Is fault clear, mixed, or weak?
3. ASSESS INJURY SEVERITY: Minor, moderate, severe, or permanent?
4. IDENTIFY POLICY LIMITS: Any caps mentioned?
5. IDENTIFY LIENS: Medicare, Medicaid, hospital, ERISA, etc.
6. ASSESS COLLECTION RISK: Insured, underinsured, uninsured?

OUTPUT FORMAT (be precise):
- Baseline gross range: $X - $Y (medical specials × multiplier)
- Liability-adjusted gross: $X - $Y (after liability modifier)
- Capped gross: $X - $Y (if policy limits apply, else "No cap identified")
- Net to client range: $A - $B (after attorney fees, costs, liens)
- Confidence: low/medium/high
- Confidence factors: [list 2-3 reasons]
- Missing for accurate valuation: [what we need]
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
You are the Settlement Valuator (Records Wrangler).
${this.getLienKnowledgePrompt()}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Your job is to:
1. If the Client Guru is making promises, check if the numbers support them. Apply modifiers!
2. If the Evidence Analyzer found missing docs, estimate how that affects case value and lien resolution.
3. If a high gross is mentioned, check:
   - Is there a policy cap that limits actual recovery?
   - Is there collection risk (underinsured/uninsured)?
   - What's the realistic NET after attorney fees and liens?
4. Be the voice of financial reality. Clients care about take-home, not theoretical gross.

Keep it concise but always distinguish baseline → adjusted → capped → net.
`;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }
}


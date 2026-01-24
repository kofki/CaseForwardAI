
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

    private buildFinancialsContextSection(context: AgentContext): string {
        const { caseData } = context;
        if (!caseData?.caseId) {
            return "No case financials available.";
        }

        const sections: string[] = [];

        // Actual financials from database
        sections.push(`=== ACTUAL CASE FINANCIALS ===`);
        sections.push(`Medical Bills: $${caseData.financials.totalMedicalBills.toLocaleString()}`);
        sections.push(`Lost Wages: $${caseData.financials.lostWages.toLocaleString()}`);
        sections.push(`Property Damage: $${caseData.financials.propertyDamage.toLocaleString()}`);
        sections.push(`Total Specials: $${(caseData.financials.totalMedicalBills + caseData.financials.lostWages + caseData.financials.propertyDamage).toLocaleString()}`);

        if (caseData.financials.demandAmount) {
            sections.push(`Demand Amount: $${caseData.financials.demandAmount.toLocaleString()}`);
        }

        // Insurance policy limits
        sections.push(`\n=== INSURANCE ===`);
        sections.push(`Carrier: ${caseData.insurance.defendantCarrier}`);
        if (caseData.insurance.policyLimit) {
            sections.push(`Policy Limit: $${caseData.insurance.policyLimit.toLocaleString()}`);
        } else {
            sections.push(`Policy Limit: UNKNOWN - Request discovery!`);
        }

        // Actual liens from database
        if (caseData.liens.length > 0) {
            sections.push(`\n=== LIENS (${caseData.liens.length}) ===`);
            let totalLiens = 0;
            for (const lien of caseData.liens) {
                sections.push(`${lien.type.toUpperCase()} (${lien.lienholderName}): $${lien.currentBalance.toLocaleString()} [Priority: ${lien.priority}, Status: ${lien.status}]`);
                totalLiens += lien.currentBalance;
            }
            sections.push(`TOTAL LIENS: $${totalLiens.toLocaleString()}`);
        } else {
            sections.push(`\n=== LIENS ===`);
            sections.push(`No liens identified yet.`);
        }

        return sections.join('\n');
    }

    async opine(input: string, context: AgentContext): Promise<string> {
        const financialsContext = this.buildFinancialsContextSection(context);

        const prompt = `
You are the Settlement Valuator (Records Wrangler) for a personal injury law firm.
${this.getLienKnowledgePrompt()}

${financialsContext}

User Input: "${input}"

ANALYZE AND ESTIMATE using the ACTUAL CASE DATA above:
1. IDENTIFY DAMAGES: Use the actual medical bills and lost wages shown above.
2. ASSESS LIABILITY: Is fault clear, mixed, or weak based on available evidence?
3. ASSESS INJURY SEVERITY: Minor, moderate, severe, or permanent?
4. APPLY POLICY LIMITS: Use the actual policy limit if known.
5. CALCULATE LIEN DEDUCTIONS: Use the actual liens listed above with their priorities.
6. ASSESS COLLECTION RISK: Insured, underinsured, uninsured?

OUTPUT FORMAT (be precise with the ACTUAL numbers):
- Baseline gross range: $X - $Y (actual specials × multiplier)
- Liability-adjusted gross: $X - $Y (after liability modifier)
- Capped gross: $X - $Y (if policy limits apply, else "No cap identified")
- Net to client range: $A - $B (after attorney fees, costs, actual liens)
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
        const financialsContext = this.buildFinancialsContextSection(context);

        const prompt = `
You are the Settlement Valuator (Records Wrangler).
${this.getLienKnowledgePrompt()}

${financialsContext}

The last message was from ${lastMessage.role}: "${lastMessage.content}"

Your job is to:
1. If the Client Guru is making promises, check if the ACTUAL numbers above support them.
2. If the Evidence Analyzer found missing docs, estimate how that affects case value and lien resolution.
3. Always reference the ACTUAL policy limit when discussing recovery caps.
4. Calculate realistic NET using the ACTUAL liens listed above, not estimates.
5. Be the voice of financial reality. Clients care about take-home, not theoretical gross.

Keep it concise but always distinguish baseline → adjusted → capped → net using real numbers.
`;

        const { text } = await generateText({
            model: google('gemini-2.5-flash-lite'),
            prompt: prompt,
        });

        return text;
    }
}



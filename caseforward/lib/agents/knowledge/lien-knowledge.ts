/**
 * Lien Knowledge Base for Settlement Valuator
 * 
 * This structured data helps the agent reason about:
 * - Who gets paid first (priority)
 * - How much can be reduced (negotiability)
 * - Whether satisfaction is mandatory (recoverability)
 * - Liability strength and policy caps
 */

export const LIEN_KNOWLEDGE = {
    lien_types: {
        medicare: {
            priority: "highest",
            recoverability: "mandatory",
            negotiability: "low",
            typical_reduction: "0-10%",
            notes: "Federal lien. Must be satisfied before disbursement. Penalties for non-compliance."
        },
        medicaid: {
            priority: "high",
            recoverability: "mandatory",
            negotiability: "medium",
            typical_reduction: "20-40%",
            notes: "State administered. Often limited to injury-related expenses."
        },
        health_insurance: {
            priority: "medium",
            recoverability: "variable",
            negotiability: "medium",
            typical_reduction: "25-50%",
            notes: "Subrogation rights vary by plan language."
        },
        erisa: {
            priority: "medium",
            recoverability: "aggressive",
            negotiability: "low",
            typical_reduction: "0-20%",
            notes: "May preempt state law. Often enforced strictly."
        },
        hospital: {
            priority: "medium",
            recoverability: "state_limited",
            negotiability: "high",
            typical_reduction: "40-70%",
            notes: "Often capped by statute. Frequently reduced in practice."
        },
        provider: {
            priority: "medium",
            recoverability: "negotiable",
            negotiability: "high",
            typical_reduction: "30-60%",
            notes: "Physicians and specialists often accept reductions."
        },
        workers_comp: {
            priority: "medium",
            recoverability: "statutory",
            negotiability: "low",
            typical_reduction: "10-25%",
            notes: "Lien rights depend on jurisdiction and third-party recovery."
        },
        child_support: {
            priority: "high",
            recoverability: "mandatory",
            negotiability: "none",
            typical_reduction: "0%",
            notes: "Court-ordered. Cannot be negotiated."
        },
        attorney_fees: {
            priority: "deducted_first",
            recoverability: "contractual",
            negotiability: "per_agreement",
            typical_reduction: "N/A",
            notes: "Typically 33-40% contingency. First deduction from gross."
        },
        other: {
            priority: "low",
            recoverability: "case_specific",
            negotiability: "unknown",
            typical_reduction: "varies",
            notes: "Requires manual review."
        }
    },

    // Case strength factors
    case_factors: {
        liability_strength: {
            clear: { multiplier: 1.0, description: "Defendant clearly at fault, strong evidence" },
            mixed: { multiplier: 0.7, description: "Comparative negligence or disputed facts" },
            weak: { multiplier: 0.4, description: "Liability questionable, risky at trial" }
        },
        policy_limit_caps: {
            unknown: { cap: null, notes: "Request policy limits discovery" },
            minimum: { cap: 25000, notes: "State minimum - likely underinsured" },
            low: { cap: 50000, notes: "Low limits may cap recovery" },
            standard: { cap: 100000, notes: "Standard personal auto" },
            high: { cap: 250000, notes: "Higher limits available" },
            commercial: { cap: 1000000, notes: "Commercial policy" },
            umbrella: { cap: null, notes: "Excess coverage may apply" }
        },
        collection_risk: {
            insured: { risk: "low", notes: "Recovery through carrier" },
            underinsured: { risk: "high", notes: "May need UM/UIM claim" },
            uninsured: { risk: "very_high", notes: "Personal assets only - often uncollectible" },
            commercial: { risk: "low", notes: "Business assets available" }
        }
    },

    // Valuation heuristics with modifiers
    heuristics: {
        base_non_econ_multiplier: {
            minor: [1.5, 3.0],
            moderate: [3.0, 5.0],
            severe: [5.0, 10.0],
            permanent: [10.0, 20.0]
        },
        modifiers: {
            liability: { clear: 1.0, mixed: 0.7, weak: 0.4 },
            objective_injury: { none: 0.8, some: 1.0, strong: 1.2 },
            treatment_gap: { none: 1.0, moderate: 0.85, large: 0.7 },
            venue: { plaintiff_friendly: 1.15, neutral: 1.0, defense_friendly: 0.85 },
            policy_limit_known: { apply_cap: true }
        },
        deductions: {
            attorney_fee_pct: [0.33, 0.40],
            case_costs: [2000, 10000],
            lien_severity: {
                mandatory_high: 0.35,  // Medicare/Medicaid present - 35% haircut
                medium: 0.20,          // Hospital/ERISA liens - 20% haircut
                low: 0.10,             // Negotiable provider liens - 10% haircut
                none: 0.0              // No liens identified
            }
        }
    },

    // Output format guidance
    output_template: {
        baseline_gross: "X - Y (before liability/collection adjustments)",
        adjusted_gross: "X - Y (after liability multiplier applied)",
        capped_gross: "X - Y (if policy limits apply)",
        net_to_client: "A - B (after attorney fees, costs, and liens)",
        confidence: "low/medium/high",
        confidence_factors: ["list reasons for confidence level"]
    }
} as const;

export type LienType = keyof typeof LIEN_KNOWLEDGE.lien_types;
export type LiabilityStrength = keyof typeof LIEN_KNOWLEDGE.case_factors.liability_strength;
export type InjurySeverity = keyof typeof LIEN_KNOWLEDGE.heuristics.base_non_econ_multiplier;

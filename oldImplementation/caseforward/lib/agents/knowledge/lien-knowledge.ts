export const LIEN_KNOWLEDGE = {
    medicare: {
        priority: 1,
        type: "Federal Super Lien",
        description: "Conditional payments made by Medicare for services related to the accident.",
        recovery_limit: "Claim against settlement proceeds, less procurement costs (attorney fees/expenses).",
        reduction_strategy: "Request Conditional Payment Letter (CPL), audit unrelated charges, request Final Demand.",
        statute: "42 U.S.C. § 1395y(b)(2)"
    },
    medicaid: {
        priority: 2,
        type: "State Statutory Lien",
        description: "State-funded medical assistance for low-income individuals.",
        recovery_limit: "Limited to the portion of the settlement allocated to past medical expenses (Ahlborn/Wos decisions).",
        reduction_strategy: "Argue Ahlborn formula where settlement is less than full case value.",
        statute: "State specific (e.g., Cal. Welf. & Inst. Code § 14124.70)"
    },
    erisa_self_funded: {
        priority: 3,
        type: "Federal Preemption",
        description: "Employer-sponsored self-funded health plan governed by ERISA.",
        recovery_limit: "Often entitled to 100% reimbursement if plan language is strong (US Airways v. McCutchen).",
        reduction_strategy: "Review Plan Document (SPD) carefully for 'first-dollar' and 'make-whole' rejection language.",
        statute: "29 U.S.C. § 1001 et seq."
    },
    hospital: {
        priority: 5,
        type: "Statutory Lien",
        description: "Lien filed by hospital for emergency services provided.",
        recovery_limit: "Usually limited to 'reasonable and necessary' charges, often capped at percentage of settlement.",
        reduction_strategy: "Audit for chargemaster vs. reasonable rates, check proper perfection (filing deadlines).",
        statute: "State specific (e.g., Cal. Civ. Code § 3045.1)"
    },
    private_insurance: {
        priority: 4,
        type: "Contractual Subrogation",
        description: "Private health insurer (e.g., Blue Cross, Aetna) seeking reimbursement.",
        recovery_limit: "Subject to 'Made Whole Doctrine' and 'Common Fund Doctrine' in many states.",
        reduction_strategy: "Assert Made Whole and Common Fund defenses to reduce claim pro-rata.",
        statute: "Contract law / State Insurance Code"
    },
    workers_comp: {
        priority: 7,
        type: "Statutory Lien",
        description: "Benefits paid by WC carrier for work-related injury involved in third-party claim.",
        recovery_limit: "Carrier entitled to reimbursement for benefits paid, subject to employer negligence deduction.",
        reduction_strategy: "Negotiate 'Credit' against future benefits, deduct employer negligence share.",
        statute: "State Labor Code"
    }
};

/**
 * Case Context Service
 * 
 * Provides a unified interface for fetching all case-related data
 * from MongoDB for use by AI agents.
 */

import mongoose from 'mongoose';
import { connectToDatabase } from '../../db/connect';
import Case, { ICase } from '../../db/models/Case';
import Document, { IDocument } from '../../db/models/Document';
import Lien, { ILien } from '../../db/models/Lien';
import Action, { IAction } from '../../db/models/Action';

// ============================================
// TypeScript Interfaces for Agent Context
// ============================================

export interface CaseContextClient {
    name: string;
    email: string;
    phone: string;
    address?: string;
}

export interface CaseContextIncident {
    date: Date;
    location: string;
    description: string;
    policeReportNumber?: string;
}

export interface CaseContextFinancials {
    totalMedicalBills: number;
    totalLiens: number;
    lostWages: number;
    propertyDamage: number;
    demandAmount?: number;
    settlementAmount?: number;
}

export interface CaseContextEvidenceChecklist {
    clientIntake: boolean;
    retainerSigned: boolean;
    policeReport: boolean;
    medicalRecords: boolean;
    medicalBills: boolean;
    incidentPhotos: boolean;
    witnessStatements: boolean;
    payStubs: boolean;
    employerLetter: boolean;
    insuranceDocs: boolean;
}

export interface CaseContextDocument {
    id: string;
    title: string;
    category: string;
    status: string;
    summary?: string;
    keyFindings: string[];
    flags: string[];
    uploadedAt: Date;
}

export interface CaseContextLien {
    id: string;
    type: string;
    status: string;
    priority: number;
    lienholderName: string;
    originalClaimed: number;
    currentBalance: number;
    negotiatedAmount?: number;
}

export interface CaseContextAction {
    id: string;
    title: string;
    actionType: string;
    status: string;
    priority: number;
    createdAt: Date;
    roundTableConsensus?: string;
}

export interface CaseContextTeam {
    leadAttorney: string;
    paralegal?: string;
    caseManager?: string;
}

export interface CaseContextInsurance {
    defendantCarrier: string;
    claimNumber: string;
    policyLimit?: number;
    adjusterName: string;
    adjusterEmail: string;
    adjusterPhone: string;
}

/**
 * Full context object passed to AI agents
 */
export interface CaseContext {
    // Core case info
    caseId: string;
    caseNumber: string;
    caseType: string;
    status: string;

    // People & Team
    client: CaseContextClient;
    team: CaseContextTeam;
    insurance: CaseContextInsurance;

    // Incident
    incident: CaseContextIncident;

    // Financial summary
    financials: CaseContextFinancials;

    // Evidence status
    evidenceChecklist: CaseContextEvidenceChecklist;
    missingDocuments: string[];

    // Related records
    documents: CaseContextDocument[];
    liens: CaseContextLien[];
    recentActions: CaseContextAction[];

    // Metadata
    aiFlags: string[];
    daysUntilSOL: number | null;
    lastAnalyzedAt?: Date;
}

// ============================================
// Helper Functions
// ============================================

function getMissingDocuments(checklist: CaseContextEvidenceChecklist): string[] {
    const missing: string[] = [];
    const labelMap: Record<keyof CaseContextEvidenceChecklist, string> = {
        clientIntake: 'Client Intake Form',
        retainerSigned: 'Signed Retainer Agreement',
        policeReport: 'Police Report',
        medicalRecords: 'Medical Records',
        medicalBills: 'Medical Bills',
        incidentPhotos: 'Incident Photos',
        witnessStatements: 'Witness Statements',
        payStubs: 'Pay Stubs',
        employerLetter: 'Employer Letter',
        insuranceDocs: 'Insurance Documents',
    };

    for (const [key, label] of Object.entries(labelMap)) {
        if (!checklist[key as keyof CaseContextEvidenceChecklist]) {
            missing.push(label);
        }
    }
    return missing;
}

function calculateDaysUntilSOL(solDate?: Date): number | null {
    if (!solDate) return null;
    const now = new Date();
    const diffMs = new Date(solDate).getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================
// Main Fetch Function
// ============================================

/**
 * Fetches the full case context including related documents, liens, and actions.
 * This is the primary data source for AI agents.
 */
export async function fetchFullCaseContext(caseId: string): Promise<CaseContext> {
    await connectToDatabase();

    // Fetch case
    const caseDoc = await Case.findById(caseId).lean<ICase>();
    if (!caseDoc) {
        throw new Error(`Case not found: ${caseId}`);
    }

    // Fetch related data in parallel
    const [documents, liens, actions] = await Promise.all([
        Document.find({ caseId: new mongoose.Types.ObjectId(caseId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean<IDocument[]>(),
        Lien.find({ caseId: new mongoose.Types.ObjectId(caseId) })
            .sort({ priority: 1 })
            .lean<ILien[]>(),
        Action.find({ caseId: new mongoose.Types.ObjectId(caseId) })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean<IAction[]>(),
    ]);

    // Build evidence checklist
    const evidenceChecklist: CaseContextEvidenceChecklist = {
        clientIntake: caseDoc.evidenceChecklist?.clientIntake ?? false,
        retainerSigned: caseDoc.evidenceChecklist?.retainerSigned ?? false,
        policeReport: caseDoc.evidenceChecklist?.policeReport ?? false,
        medicalRecords: caseDoc.evidenceChecklist?.medicalRecords ?? false,
        medicalBills: caseDoc.evidenceChecklist?.medicalBills ?? false,
        incidentPhotos: caseDoc.evidenceChecklist?.incidentPhotos ?? false,
        witnessStatements: caseDoc.evidenceChecklist?.witnessStatements ?? false,
        payStubs: caseDoc.evidenceChecklist?.payStubs ?? false,
        employerLetter: caseDoc.evidenceChecklist?.employerLetter ?? false,
        insuranceDocs: caseDoc.evidenceChecklist?.insuranceDocs ?? false,
    };

    // Transform documents
    const contextDocuments: CaseContextDocument[] = documents.map((doc) => ({
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        status: doc.status,
        summary: doc.aiAnalysis?.summary,
        keyFindings: doc.aiAnalysis?.keyFindings ?? [],
        flags: doc.aiAnalysis?.flags ?? [],
        uploadedAt: doc.uploadedAt,
    }));

    // Transform liens
    const contextLiens: CaseContextLien[] = liens.map((lien) => ({
        id: lien._id.toString(),
        type: lien.type,
        status: lien.status,
        priority: lien.priority,
        lienholderName: lien.lienholder.name,
        originalClaimed: lien.amounts.originalClaimed,
        currentBalance: lien.amounts.currentBalance,
        negotiatedAmount: lien.amounts.negotiatedAmount,
    }));

    // Transform actions
    const contextActions: CaseContextAction[] = actions.map((action) => ({
        id: action._id.toString(),
        title: action.title,
        actionType: action.actionType,
        status: action.status,
        priority: action.priority,
        createdAt: action.createdAt as Date,
        roundTableConsensus: action.aiAnalysis?.roundTable?.consensus,
    }));

    // Build incident location string
    const incidentLocation = [
        caseDoc.incident?.location?.address,
        caseDoc.incident?.location?.city,
        caseDoc.incident?.location?.state,
    ]
        .filter(Boolean)
        .join(', ');

    // Assemble full context
    const context: CaseContext = {
        caseId: caseDoc._id.toString(),
        caseNumber: caseDoc.caseNumber,
        caseType: caseDoc.caseType,
        status: caseDoc.status,

        client: {
            name: caseDoc.client.name,
            email: caseDoc.client.email,
            phone: caseDoc.client.phone,
            address: caseDoc.client.address,
        },

        team: {
            leadAttorney: caseDoc.team.leadAttorney,
            paralegal: caseDoc.team.paralegal,
            caseManager: caseDoc.team.caseManager,
        },

        insurance: {
            defendantCarrier: caseDoc.insurance?.defendantPolicy?.carrier ?? 'Unknown',
            claimNumber: caseDoc.insurance?.defendantPolicy?.claimNumber ?? '',
            policyLimit: caseDoc.insurance?.defendantPolicy?.policyLimit,
            adjusterName: caseDoc.insurance?.defendantPolicy?.adjuster?.name ?? '',
            adjusterEmail: caseDoc.insurance?.defendantPolicy?.adjuster?.email ?? '',
            adjusterPhone: caseDoc.insurance?.defendantPolicy?.adjuster?.phone ?? '',
        },

        incident: {
            date: caseDoc.incident.date,
            location: incidentLocation,
            description: caseDoc.incident.description,
            policeReportNumber: caseDoc.incident.policeReportNumber,
        },

        financials: {
            totalMedicalBills: caseDoc.financials?.totalMedicalBills ?? 0,
            totalLiens: caseDoc.financials?.totalLiens ?? 0,
            lostWages: caseDoc.financials?.lostWages ?? 0,
            propertyDamage: caseDoc.financials?.propertyDamage ?? 0,
            demandAmount: caseDoc.financials?.demandAmount,
            settlementAmount: caseDoc.financials?.settlementAmount,
        },

        evidenceChecklist,
        missingDocuments: getMissingDocuments(evidenceChecklist),

        documents: contextDocuments,
        liens: contextLiens,
        recentActions: contextActions,

        aiFlags: caseDoc.aiMetadata?.flags ?? [],
        daysUntilSOL: calculateDaysUntilSOL(caseDoc.dates?.statuteOfLimitations),
        lastAnalyzedAt: caseDoc.aiMetadata?.lastAnalyzedAt,
    };

    return context;
}

/**
 * Generates a text summary of the case context for injection into prompts
 */
export function formatCaseContextForPrompt(context: CaseContext): string {
    const sections: string[] = [];

    // Header
    sections.push(`=== CASE CONTEXT ===`);
    sections.push(`Case #${context.caseNumber} | Type: ${context.caseType} | Status: ${context.status}`);

    // Client
    sections.push(`\nCLIENT: ${context.client.name}`);
    sections.push(`  Email: ${context.client.email} | Phone: ${context.client.phone}`);

    // Team
    sections.push(`\nTEAM: Lead Attorney: ${context.team.leadAttorney}`);
    if (context.team.paralegal) sections.push(`  Paralegal: ${context.team.paralegal}`);

    // Incident
    sections.push(`\nINCIDENT: ${context.incident.date.toLocaleDateString()}`);
    sections.push(`  Location: ${context.incident.location}`);
    sections.push(`  Description: ${context.incident.description}`);

    // Financials
    sections.push(`\nFINANCIALS:`);
    sections.push(`  Medical Bills: $${context.financials.totalMedicalBills.toLocaleString()}`);
    sections.push(`  Lost Wages: $${context.financials.lostWages.toLocaleString()}`);
    sections.push(`  Total Liens: $${context.financials.totalLiens.toLocaleString()}`);
    if (context.financials.demandAmount) {
        sections.push(`  Demand Amount: $${context.financials.demandAmount.toLocaleString()}`);
    }

    // Insurance
    sections.push(`\nINSURANCE:`);
    sections.push(`  Carrier: ${context.insurance.defendantCarrier}`);
    sections.push(`  Claim #: ${context.insurance.claimNumber}`);
    if (context.insurance.policyLimit) {
        sections.push(`  Policy Limit: $${context.insurance.policyLimit.toLocaleString()}`);
    }

    // Evidence
    sections.push(`\nEVIDENCE STATUS:`);
    if (context.missingDocuments.length > 0) {
        sections.push(`  ⚠️ MISSING: ${context.missingDocuments.join(', ')}`);
    } else {
        sections.push(`  ✅ All critical documents collected`);
    }

    // Liens
    if (context.liens.length > 0) {
        sections.push(`\nLIENS (${context.liens.length}):`);
        for (const lien of context.liens) {
            sections.push(`  - ${lien.type} (${lien.lienholderName}): $${lien.currentBalance.toLocaleString()} [${lien.status}]`);
        }
    }

    // SOL Warning
    if (context.daysUntilSOL !== null) {
        if (context.daysUntilSOL <= 90) {
            sections.push(`\n🚨 STATUTE OF LIMITATIONS: ${context.daysUntilSOL} days remaining!`);
        } else {
            sections.push(`\nStatute of Limitations: ${context.daysUntilSOL} days remaining`);
        }
    }

    // AI Flags
    if (context.aiFlags.length > 0) {
        sections.push(`\nAI FLAGS: ${context.aiFlags.join(', ')}`);
    }

    return sections.join('\n');
}

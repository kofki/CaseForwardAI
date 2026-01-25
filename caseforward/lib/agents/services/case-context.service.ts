/**
 * Case Context Service
 * 
 * Provides a unified interface for fetching all case-related data
 * from MongoDB for use by AI agents.
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { getCaseById } from '@/lib/db/models/Case';
import { Document } from '@/lib/db/models';

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
    textContent?: string; // Extracted document text for AI search
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

// Add these type definitions near the top of the file
interface DocumentInfo {
    name: string;
    type: string;
    [key: string]: any;
}

interface LienInfo {
    type: string;
    lienholderName: string;
    currentBalance: number;
    priority: string;
    status: string;
    [key: string]: any;
}

interface ActionInfo {
    title: string;
    status: string;
    dueDate?: Date;
    [key: string]: any;
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
    await connectDB();

    const caseData = await getCaseById(caseId);

    if (!caseData) {
        throw new Error(`Case ${caseId} not found`);
    }

    // Build evidence checklist
    const evidenceChecklist: CaseContextEvidenceChecklist = {
        clientIntake: caseData.evidenceChecklist?.clientIntake ?? false,
        retainerSigned: caseData.evidenceChecklist?.retainerSigned ?? false,
        policeReport: caseData.evidenceChecklist?.policeReport ?? false,
        medicalRecords: caseData.evidenceChecklist?.medicalRecords ?? false,
        medicalBills: caseData.evidenceChecklist?.medicalBills ?? false,
        incidentPhotos: caseData.evidenceChecklist?.incidentPhotos ?? false,
        witnessStatements: caseData.evidenceChecklist?.witnessStatements ?? false,
        payStubs: caseData.evidenceChecklist?.payStubs ?? false,
        employerLetter: caseData.evidenceChecklist?.employerLetter ?? false,
        insuranceDocs: caseData.evidenceChecklist?.insuranceDocs ?? false,
    };

    // FETCH DOCUMENTS from the Document collection (not from Case)
    let contextDocuments: CaseContextDocument[] = [];
    try {
        const docsFromDB = await Document.find({
            caseId: new mongoose.Types.ObjectId(caseId)
        }).lean();

        contextDocuments = docsFromDB.map((doc: any) => ({
            id: doc._id?.toString() || '',
            title: doc.title || doc.file?.originalName || 'Untitled',
            category: doc.category || 'other',
            status: doc.status || 'unknown',
            summary: doc.aiAnalysis?.summary || doc.extractedContent?.text?.substring(0, 500) || '',
            keyFindings: doc.aiAnalysis?.keyFindings ?? [],
            flags: doc.aiAnalysis?.flags ?? [],
            uploadedAt: doc.uploadedAt || doc.createdAt || new Date(),
            // Include extracted text content for AI to search
            textContent: doc.extractedContent?.text || '',
        }));
    } catch (docError) {
        console.warn('Error fetching documents for case context:', docError);
        // Fall back to case.documents if available
        contextDocuments = (caseData.documents || []).map((doc: DocumentInfo) => ({
            id: doc._id?.toString() || '',
            title: doc.title || 'Untitled',
            category: doc.category || 'other',
            status: doc.status || 'unknown',
            summary: doc.aiAnalysis?.summary,
            keyFindings: doc.aiAnalysis?.keyFindings ?? [],
            flags: doc.aiAnalysis?.flags ?? [],
            uploadedAt: doc.uploadedAt || new Date(),
        }));
    }

    // Transform liens (safely handle undefined)
    const contextLiens: CaseContextLien[] = (caseData.liens || []).map((lien: LienInfo) => ({
        id: lien._id?.toString() || '',
        type: lien.type || 'other',
        status: lien.status || 'unknown',
        priority: lien.priority || 0,
        lienholderName: lien.lienholder?.name || 'Unknown',
        originalClaimed: lien.amounts?.originalClaimed || 0,
        currentBalance: lien.amounts?.currentBalance || 0,
        negotiatedAmount: lien.amounts?.negotiatedAmount,
    }));

    // Transform actions (safely handle undefined)
    const contextActions: CaseContextAction[] = (caseData.recentActions || []).map((action: ActionInfo) => ({
        id: action._id?.toString() || '',
        title: action.title || 'Untitled',
        actionType: action.actionType || 'general',
        status: action.status || 'pending',
        priority: action.priority || 0,
        createdAt: action.createdAt as Date || new Date(),
        roundTableConsensus: action.aiAnalysis?.roundTable?.consensus,
    }));

    // Build incident location string
    const incidentLocation = [
        caseData.incident?.location?.address,
        caseData.incident?.location?.city,
        caseData.incident?.location?.state,
    ]
        .filter(Boolean)
        .join(', ');

    // Assemble full context
    const context: CaseContext = {
        caseId: caseData._id.toString(),
        caseNumber: caseData.caseNumber || 'Unknown',
        caseType: caseData.caseType || 'other',
        status: caseData.status || 'unknown',

        client: {
            name: caseData.client?.name ||
                (caseData.client?.firstName && caseData.client?.lastName
                    ? `${caseData.client.firstName} ${caseData.client.lastName}`
                    : 'Unknown Client'),
            email: caseData.client?.email || '',
            phone: caseData.client?.phone || '',
            address: caseData.client?.address || '',
        },

        team: {
            leadAttorney: caseData.team?.leadAttorney || caseData.attorney || 'Unassigned',
            paralegal: caseData.team?.paralegal || caseData.paralegal,
            caseManager: caseData.team?.caseManager,
        },

        insurance: {
            defendantCarrier: caseData.insurance?.defendantPolicy?.carrier ?? caseData.defendantInsurance ?? 'Unknown',
            claimNumber: caseData.insurance?.defendantPolicy?.claimNumber ?? '',
            policyLimit: caseData.insurance?.defendantPolicy?.policyLimit,
            adjusterName: caseData.insurance?.defendantPolicy?.adjuster?.name ?? '',
            adjusterEmail: caseData.insurance?.defendantPolicy?.adjuster?.email ?? '',
            adjusterPhone: caseData.insurance?.defendantPolicy?.adjuster?.phone ?? '',
        },

        incident: {
            date: caseData.incident?.date || caseData.incidentDate || new Date(),
            location: incidentLocation || caseData.incidentLocation || 'Unknown',
            description: caseData.incident?.description || caseData.incidentDescription || '',
            policeReportNumber: caseData.incident?.policeReportNumber,
        },

        financials: {
            totalMedicalBills: caseData.financials?.totalMedicalBills ?? 0,
            totalLiens: caseData.financials?.totalLiens ?? 0,
            lostWages: caseData.financials?.lostWages ?? 0,
            propertyDamage: caseData.financials?.propertyDamage ?? 0,
            demandAmount: caseData.financials?.demandAmount,
            settlementAmount: caseData.financials?.settlementAmount,
        },

        evidenceChecklist,
        missingDocuments: getMissingDocuments(evidenceChecklist),

        documents: contextDocuments,
        liens: contextLiens,
        recentActions: contextActions,

        aiFlags: caseData.aiMetadata?.flags ?? caseData.aiMetadata?.riskFlags ?? [],
        daysUntilSOL: calculateDaysUntilSOL(caseData.dates?.statuteOfLimitations || caseData.statuteOfLimitationsDate),
        lastAnalyzedAt: caseData.aiMetadata?.lastAnalyzedAt || caseData.aiMetadata?.lastProcessedAt,
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

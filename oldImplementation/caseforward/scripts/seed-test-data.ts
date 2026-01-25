/**
 * Seed Test Data Script
 * 
 * Populates MongoDB with realistic test cases covering all case types and document categories.
 * Run with: npx ts-node scripts/seed-test-data.ts
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';
import connectToDatabase from '../lib/db/connect';
import Case from '../lib/db/models/Case';
import Document from '../lib/db/models/Document';
import Lien from '../lib/db/models/Lien';
import {
    CaseType,
    CaseStatus,
    DocumentCategory,
    DocumentStatus,
    LienType,
    LienStatus,
} from '../lib/db/types/enums';

// ============================================
// Test Case Scenarios
// ============================================

const TEST_CASES = [
    {
        caseType: CaseType.AUTO_ACCIDENT,
        scenario: 'Rear-end collision with soft tissue injury',
        client: {
            name: 'Maria Garcia',
            email: 'maria.garcia@email.com',
            phone: '555-0101',
        },
        incident: {
            date: new Date('2025-08-15'),
            location: { city: 'Miami', state: 'FL', address: 'US-1 and SW 8th St' },
            description: 'Client was stopped at a red light when struck from behind by distracted driver. Sustained whiplash and lower back strain.',
        },
        financials: {
            totalMedicalBills: 12500,
            lostWages: 4200,
            propertyDamage: 3800,
        },
        insurance: {
            carrier: 'State Farm',
            claimNumber: 'SF-2025-88432',
            policyLimit: 100000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: true,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: true,
            witnessStatements: false,
            payStubs: true,
            employerLetter: false,
            insuranceDocs: true,
        },
        liens: [
            { type: LienType.MEDICARE, holder: 'CMS', amount: 3200 },
        ],
    },
    {
        caseType: CaseType.PREMISES_LIABILITY,
        scenario: 'Grocery store fall with surveillance evidence',
        client: {
            name: 'Robert Thompson',
            email: 'r.thompson@email.com',
            phone: '555-0102',
        },
        incident: {
            date: new Date('2025-10-22'),
            location: { city: 'Orlando', state: 'FL', address: 'Publix #1234, Colonial Dr' },
            description: 'Client slipped on unmarked wet floor in produce section. Fell and fractured left wrist. Surveillance footage obtained.',
        },
        financials: {
            totalMedicalBills: 28000,
            lostWages: 8500,
            propertyDamage: 0,
        },
        insurance: {
            carrier: 'Travelers Insurance',
            claimNumber: 'TRV-2025-44219',
            policyLimit: 250000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: false,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: true,
            witnessStatements: true,
            payStubs: true,
            employerLetter: true,
            insuranceDocs: true,
        },
        liens: [
            { type: LienType.HOSPITAL, holder: 'Orlando Regional Medical', amount: 18500 },
            { type: LienType.HEALTH_INSURANCE, holder: 'Blue Cross', amount: 4200 },
        ],
    },
    {
        caseType: CaseType.MEDICAL_MALPRACTICE,
        scenario: 'Surgical error with expert witness',
        client: {
            name: 'Jennifer Walsh',
            email: 'j.walsh@email.com',
            phone: '555-0103',
        },
        incident: {
            date: new Date('2025-03-10'),
            location: { city: 'Tampa', state: 'FL', address: 'Tampa General Hospital' },
            description: 'During routine appendectomy, surgeon perforated bowel. Required emergency surgery and extended ICU stay. Expert witness report obtained.',
        },
        financials: {
            totalMedicalBills: 185000,
            lostWages: 42000,
            propertyDamage: 0,
        },
        insurance: {
            carrier: 'Medical Protective',
            claimNumber: 'MP-2025-99123',
            policyLimit: 1000000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: false,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: false,
            witnessStatements: true,
            payStubs: true,
            employerLetter: true,
            insuranceDocs: true,
        },
        liens: [
            { type: LienType.HOSPITAL, holder: 'Tampa General Hospital', amount: 95000 },
            { type: LienType.MEDICAID, holder: 'Florida Medicaid', amount: 28000 },
        ],
    },
    {
        caseType: CaseType.WRONGFUL_DEATH,
        scenario: 'Commercial truck fatality with high policy limits',
        client: {
            name: 'David Martinez',
            email: 'd.martinez.estate@email.com',
            phone: '555-0104',
        },
        incident: {
            date: new Date('2025-06-28'),
            location: { city: 'Jacksonville', state: 'FL', address: 'I-95 Southbound, Mile Marker 352' },
            description: 'Decedent struck by commercial 18-wheeler that ran red light. Decedent died at scene. Multiple witnesses. Trucking company cited.',
        },
        financials: {
            totalMedicalBills: 12000,
            lostWages: 950000,
            propertyDamage: 45000,
        },
        insurance: {
            carrier: 'Great West Casualty',
            claimNumber: 'GWC-2025-77841',
            policyLimit: 2000000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: true,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: true,
            witnessStatements: true,
            payStubs: true,
            employerLetter: true,
            insuranceDocs: true,
        },
        liens: [],
    },
    {
        caseType: CaseType.SLIP_AND_FALL,
        scenario: 'Restaurant wet floor, moderate injuries',
        client: {
            name: 'Patricia Johnson',
            email: 'p.johnson@email.com',
            phone: '555-0105',
        },
        incident: {
            date: new Date('2025-11-05'),
            location: { city: 'Fort Lauderdale', state: 'FL', address: "Applebee's, Sunrise Blvd" },
            description: 'Client slipped on water near restroom with no wet floor sign. Sustained hip bruising and mild concussion.',
        },
        financials: {
            totalMedicalBills: 8500,
            lostWages: 2100,
            propertyDamage: 0,
        },
        insurance: {
            carrier: 'Hartford Insurance',
            claimNumber: 'HRT-2025-55621',
            policyLimit: 150000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: false,
            medicalRecords: true,
            medicalBills: false,
            incidentPhotos: false,
            witnessStatements: false,
            payStubs: false,
            employerLetter: false,
            insuranceDocs: true,
        },
        liens: [
            { type: LienType.PROVIDER, holder: 'Dr. Smith Orthopedics', amount: 3200 },
        ],
    },
    {
        caseType: CaseType.PRODUCT_LIABILITY,
        scenario: 'Defective power tool injury',
        client: {
            name: 'Michael Chen',
            email: 'm.chen@email.com',
            phone: '555-0106',
        },
        incident: {
            date: new Date('2025-09-18'),
            location: { city: 'Naples', state: 'FL', address: 'Client residence' },
            description: 'Circular saw guard failed during use, causing severe laceration to left hand. Product recall issued after incident.',
        },
        financials: {
            totalMedicalBills: 52000,
            lostWages: 18000,
            propertyDamage: 450,
        },
        insurance: {
            carrier: 'Zurich Insurance',
            claimNumber: 'ZUR-2025-33198',
            policyLimit: 500000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: false,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: true,
            witnessStatements: false,
            payStubs: true,
            employerLetter: false,
            insuranceDocs: true,
        },
        liens: [
            { type: LienType.HOSPITAL, holder: 'NCH Healthcare', amount: 28000 },
            { type: LienType.ERISA, holder: 'Employer Health Plan', amount: 12000 },
        ],
    },
];

// ============================================
// Document Templates
// ============================================

function generateDocuments(caseId: mongoose.Types.ObjectId, checklist: Record<string, boolean>) {
    const docs: any[] = [];
    const now = new Date();

    const docTemplates: { category: DocumentCategory; title: string; checklistKey: keyof typeof checklist }[] = [
        { category: DocumentCategory.CLIENT_INTAKE, title: 'Client Intake Form', checklistKey: 'clientIntake' },
        { category: DocumentCategory.RETAINER_AGREEMENT, title: 'Signed Retainer Agreement', checklistKey: 'retainerSigned' },
        { category: DocumentCategory.POLICE_REPORT, title: 'Police Accident Report', checklistKey: 'policeReport' },
        { category: DocumentCategory.MEDICAL_RECORD, title: 'Medical Records - Initial ER Visit', checklistKey: 'medicalRecords' },
        { category: DocumentCategory.MEDICAL_BILL, title: 'Medical Bills Summary', checklistKey: 'medicalBills' },
        { category: DocumentCategory.INCIDENT_PHOTOS, title: 'Incident Scene Photos', checklistKey: 'incidentPhotos' },
        { category: DocumentCategory.WITNESS_STATEMENT, title: 'Witness Statement', checklistKey: 'witnessStatements' },
        { category: DocumentCategory.PAY_STUBS, title: 'Pay Stubs - 6 Months', checklistKey: 'payStubs' },
        { category: DocumentCategory.EMPLOYER_LETTER, title: 'Employer Lost Wage Letter', checklistKey: 'employerLetter' },
        { category: DocumentCategory.INSURANCE_DOCS, title: 'Insurance Policy Declaration', checklistKey: 'insuranceDocs' },
    ];

    for (const template of docTemplates) {
        if (checklist[template.checklistKey]) {
            docs.push({
                caseId,
                title: template.title,
                category: template.category,
                status: DocumentStatus.APPROVED,
                file: {
                    originalName: `${template.title.toLowerCase().replace(/ /g, '_')}.pdf`,
                    storagePath: `/documents/${caseId}/${template.category}.pdf`,
                    storageProvider: 'local',
                    mimeType: 'application/pdf',
                    size: Math.floor(Math.random() * 500000) + 50000,
                    hash: `hash_${new mongoose.Types.ObjectId().toString()}`,
                },
                aiAnalysis: {
                    isProcessed: true,
                    processedAt: now,
                    summary: `AI-processed ${template.title}`,
                    keyFindings: [`Key finding from ${template.title}`],
                    flags: [],
                    confidence: 0.9,
                },
                uploadedBy: 'System Seed',
                uploadedAt: now,
                tags: [template.category],
            });
        }
    }

    return docs;
}

// ============================================
// Main Seed Function
// ============================================

async function seed() {
    console.log('🌱 Starting database seed...\n');

    await connectToDatabase();

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await Case.deleteMany({});
    await Document.deleteMany({});
    await Lien.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Seed cases
    for (const testCase of TEST_CASES) {
        console.log(`📁 Creating case: ${testCase.caseType} - ${testCase.scenario}`);

        // Create case
        const caseNumber = `CF-2025-${Math.floor(Math.random() * 90000) + 10000}`;
        const fileNumber = `FN-${Math.floor(Math.random() * 9000) + 1000}`;
        const solDate = new Date(testCase.incident.date);
        solDate.setFullYear(solDate.getFullYear() + 4); // 4 year SOL

        const newCase = await Case.create({
            caseNumber,
            fileNumber,
            caseType: testCase.caseType,
            status: CaseStatus.TREATMENT,
            client: testCase.client,
            incident: {
                date: testCase.incident.date,
                location: testCase.incident.location,
                description: testCase.incident.description,
            },
            defendants: [
                { name: 'Defendant TBD', type: 'individual' },
            ],
            insurance: {
                defendantPolicy: {
                    carrier: testCase.insurance.carrier,
                    claimNumber: testCase.insurance.claimNumber,
                    policyLimit: testCase.insurance.policyLimit,
                    adjuster: {
                        name: 'John Adjuster',
                        phone: '555-9999',
                        email: 'adjuster@insurance.com',
                    },
                },
            },
            dates: {
                incidentDate: testCase.incident.date,
                intakeDate: new Date(),
                statuteOfLimitations: solDate,
            },
            financials: testCase.financials,
            evidenceChecklist: testCase.evidenceChecklist,
            team: {
                leadAttorney: 'Test Attorney',
                paralegal: 'Test Paralegal',
            },
            aiMetadata: {
                pendingActions: 0,
                completedActions: 0,
                flags: [],
            },
        });

        console.log(`   ✅ Case created: ${caseNumber}`);

        // Create documents
        const docs = generateDocuments(newCase._id as mongoose.Types.ObjectId, testCase.evidenceChecklist);
        if (docs.length > 0) {
            await Document.insertMany(docs);
            console.log(`   📄 Created ${docs.length} documents`);
        }

        // Create liens
        for (const lien of testCase.liens) {
            await Lien.create({
                caseId: newCase._id,
                type: lien.type,
                status: LienStatus.CONFIRMED,
                lienholder: {
                    name: lien.holder,
                },
                amounts: {
                    originalClaimed: lien.amount,
                    currentBalance: lien.amount,
                    paidAmount: 0,
                    waivedAmount: 0,
                },
                dates: {
                    identifiedDate: new Date(),
                },
            });
        }
        if (testCase.liens.length > 0) {
            console.log(`   💰 Created ${testCase.liens.length} liens`);
        }

        console.log('');
    }

    console.log('✅ Seed complete!');
    console.log(`   📁 ${TEST_CASES.length} cases created`);

    // List case IDs for testing
    const cases = await Case.find({}).select('_id caseNumber caseType');
    console.log('\n📋 Case IDs for testing:');
    for (const c of cases) {
        console.log(`   ${c.caseType}: ${c._id} (${c.caseNumber})`);
    }

    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});

import type { CaseContext } from '../lib/agents/services/case-context.service';

// Mock Case Context
const MOCK_CONTEXT: any = {
    caseId: 'mock-id',
    caseNumber: 'CASE-2024-001',
    caseType: 'auto_accident',
    status: 'treatment',
    client: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
    },
    team: {
        leadAttorney: 'Jessica Pearson',
    },
    insurance: {
        defendantCarrier: 'State Farm',
        claimNumber: 'SF-123456789',
        policyLimit: 50000,
        adjusterName: 'Bob Smith',
        adjusterEmail: 'bob@statefarm.com',
        adjusterPhone: '555-9999',
    },
    incident: {
        date: new Date('2023-11-15'),
        location: 'Miami, FL',
        description: 'Rear-ended at red light by commercial truck. Client sustained whiplash and lower back pain.',
    },
    financials: {
        totalMedicalBills: 15400,
        totalLiens: 2500,
        lostWages: 3200,
        propertyDamage: 8500,
        settlementAmount: 0 // Added missing property
    },
    evidenceChecklist: {
        clientIntake: true,
        retainerSigned: true,
        policeReport: true,
        medicalRecords: false, // Critical missing piece
        medicalBills: true,
        incidentPhotos: true,
        witnessStatements: false,
        payStubs: true,
        employerLetter: false,
        insuranceDocs: true,
    },
    missingDocuments: ['Medical Records', 'Witness Statements', 'Employer Letter'],
    documents: [],
    liens: [
        {
            id: 'lien-1',
            type: 'medicare',
            status: 'active',
            priority: 1,
            lienholderName: 'Medicare',
            originalClaimed: 2500,
            currentBalance: 2500,
        }
    ],
    recentActions: [],
    aiFlags: ['Potential Causal Issue - Prior Back Injury'],
    daysUntilSOL: 320,
};

async function main() {
    // Check if API key is set
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
        console.error("Error: GEMINI_API_KEY environment variable not set.");
        // Check local env file for testing
        try {
            const fs = require('fs');
            const path = require('path');
            const envPath = path.resolve(__dirname, '../.env.local');
            if (fs.existsSync(envPath)) {
                console.log("Loading .env.local...");
                const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
                for (const k in envConfig) {
                    process.env[k] = envConfig[k];
                }
            }
        } catch (e) {
            console.log("Failed to load .env.local manually", e);
        }
    }

    console.log("🚀 Starting Round Table Integration Test...");
    console.log(`Case: ${MOCK_CONTEXT.caseNumber} - ${MOCK_CONTEXT.caseType}`);
    console.log(`Scenario: Client asking for update, but medical records are missing.`);

    // Dynamic import to ensure env vars are loaded first
    const { RoundTable } = await import('../lib/agents/round-table');
    const roundTable = new RoundTable();
    const input = "Client just called asking when his settlement check is coming. He says he's done treating.";

    try {
        const result = await roundTable.discuss(input, MOCK_CONTEXT);

        console.log("\n✅ Round Table Discussion Completed!");
        console.log("---------------------------------------------------");

        console.log("\n💬 Discussion History:");
        result.history.forEach(msg => {
            console.log(`\n[${msg.role}]:`);
            console.log(msg.content);
        });

        console.log("\n---------------------------------------------------");
        console.log("📋 FINAL ACTION CARD:");
        console.log(JSON.stringify(result.card, null, 2));

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

main();

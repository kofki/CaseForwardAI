import dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import connectToDatabase from '../lib/db/connect';
import Case from '../lib/db/models/Case';

async function main() {
    await connectToDatabase();
    console.log('Connected to database');

    // 1. Create a dummy case to match against if it doesn't exist
    const dummyCaseNum = 'TEST-INTAKE-001';
    let existingCase = await Case.findOne({ caseNumber: dummyCaseNum });

    if (!existingCase) {
        console.log('Creating test case...');
        existingCase = await Case.create({
            caseNumber: dummyCaseNum,
            fileNumber: 'FILE-001',
            caseType: 'auto_accident',
            status: 'intake',
            client: {
                firstName: 'Sherlock',
                lastName: 'Holmes',
                email: 'sherlock@bakerstreet.com',
                phone: '555-0199',
            },
            incidentDate: new Date('2025-01-15'),
            incidentLocation: 'London, UK',
            incidentDescription: 'Auto accident involving a horse carriage and a taxi.',
            injuries: ['whiplash'],
            financials: {
                totalMedicalBills: 5000,
                totalMedicalPaid: 0,
                lostWages: 0,
                propertyDamage: 0,
                painAndSuffering: 0,
                settlementAmount: 0,
                attorneyFees: 0,
                caseCosts: 0,
                netToClient: 0,
            },
            aiMetadata: {
                keyIssues: [],
                missingDocuments: [],
                nextSteps: [],
                riskFlags: [],
                confidenceScore: 0,
            },
        });
        console.log(`Created test case: ${existingCase._id}`);
    } else {
        console.log(`Using existing test case: ${existingCase._id}`);
    }

    console.log('\nTest setup complete.');
    console.log(`Case: ${existingCase.caseNumber}`);
    console.log(`Client: ${existingCase.client.firstName} ${existingCase.client.lastName}`);

    process.exit(0);
}

main().catch(console.error);

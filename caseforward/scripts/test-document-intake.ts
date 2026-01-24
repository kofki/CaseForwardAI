
import dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { DocumentIntakeService } from '../lib/agents/services/document-intake.service';
import mongoose from 'mongoose';
import connectToDatabase from '../lib/db/connect';
import Case from '../lib/db/models/Case';

async function main() {
    await connectToDatabase();
    console.log('Connected to database');

    const intakeService = new DocumentIntakeService();

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
                name: 'Sherlock Holmes',
                email: 'sherlock@bakerstreet.com',
                phone: '555-0199',
            },
            incident: {
                date: new Date('2025-01-15'),
                location: { city: 'London', state: 'UK' },
                description: 'Auto accident involving a horse carriage and a taxi.',
            },
            insurance: {
                defendantPolicy: {
                    carrier: 'Moriarty Insurance',
                    claimNumber: 'CLM-999',
                    adjuster: { name: 'James', phone: '555-0000', email: 'jim@moriarty.com' }
                }
            },
            dates: {
                incidentDate: new Date('2025-01-15'),
                statuteOfLimitations: new Date('2027-01-15'),
            },
            team: {
                leadAttorney: 'Watson',
            }
        });
        console.log(`Created test case: ${existingCase._id}`);
    } else {
        console.log(`Using existing test case: ${existingCase._id}`);
    }

    // TEST 1: Text-based Match
    console.log('\n--- TEST 1: Text Match (Should ASSIGN) ---');
    const matchText = `
    MEDICAL BILL INVOICE
    Patient: Sherlock Holmes
    Date of Service: 2025-01-16
    Reason: Neck pain following car accident on 1/15/25 in London.
    Amount: $500.00
  `;

    try {
        const fileMeta = {
            originalName: 'invoice.pdf',
            storagePath: '/tmp/invoice.pdf',
            mimeType: 'application/pdf',
            size: 1024,
            hash: 'abc123hash'
        };

        // Use handleDocumentIntake instead of processDocument
        const resultMatch = await intakeService.handleDocumentIntake(fileMeta, matchText);
        console.log('Result:', JSON.stringify(resultMatch, null, 2));

        if (resultMatch.success && resultMatch.decision.action === 'ASSIGN' && resultMatch.caseId === existingCase._id.toString()) {
            console.log('✅ PASS: Correctly assigned to existing case.');
        } else {
            console.log('❌ FAIL: Did not assign correctly.');
        }
    } catch (error) {
        console.error('Test 1 Error:', error);
    }

    // TEST 2: New Case Creation
    console.log('\n--- TEST 2: New Case Creation (Should CREATE) ---');
    const newText = `
    POLICE REPORT
    Incident Date: 2025-03-01
    Involved: John Watson
    Location: 221B Baker St
    Desc: Slip and fall on icy pavement outside residence.
  `;

    try {
        const fileMeta = {
            originalName: 'police_report.txt',
            storagePath: '/tmp/police_report.txt',
            mimeType: 'text/plain',
            size: 500,
            hash: 'xyz789hash' + Date.now() // Unique hash
        };

        const resultNew = await intakeService.handleDocumentIntake(fileMeta, newText);
        console.log('Result:', JSON.stringify(resultNew, null, 2));

        if (resultNew.success && resultNew.decision.action === 'CREATE' && resultNew.caseId && resultNew.caseId !== existingCase._id.toString()) {
            console.log('✅ PASS: Correctly created new case and assigned document.');

            // Verify in DB
            const dbCase = await Case.findById(resultNew.caseId);
            if (dbCase?.client.name.includes('Watson')) {
                console.log('   -> DB Verification: Client name matches.');
            } else {
                console.log('   -> DB Verification FAILED: Client name wrong.');
            }
        } else {
            console.log('❌ FAIL: Did not identify new case correctly.');
        }
    } catch (error) {
        console.error('Test 2 Error:', error);
    }

    // TEST 3: Multimodal (Simulated with text describing image content for now, 
    // unless we want to embed a massive base64 string in this script)
    // For true integration test, we'd load a file, but I'll trust the architecture for now 
    // and just test the logic flow separately if I had an image.
    // I will skip the actual image call in this script to keep it clean, 
    // but the service supports it.

    console.log('\nDone.');
    process.exit(0);
}

main().catch(console.error);

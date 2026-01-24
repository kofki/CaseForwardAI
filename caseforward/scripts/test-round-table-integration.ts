/**
 * Integration Test for Round Table with Database
 * 
 * Tests the full flow: DB connection → Case context fetch → Round table discussion → Action persistence
 * Run with: npx ts-node scripts/test-round-table-integration.ts
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import connectToDatabase from '../lib/db/connect';
import Case from '../lib/db/models/Case';
import Action from '../lib/db/models/Action';
import { runRoundTableAndPersist } from '../lib/agents/services/round-table.service';
import { InputSourceType } from '../lib/db/types/enums';

async function test() {
    console.log('🧪 Round Table Integration Test\n');
    console.log('='.repeat(60));

    // 1. Connect to database
    console.log('\n1️⃣ Connecting to database...');
    await connectToDatabase();
    console.log('   ✅ Connected\n');

    // 2. Get a test case
    console.log('2️⃣ Fetching a test case...');
    const testCase = await Case.findOne({}).lean();
    if (!testCase) {
        console.error('   ❌ No cases found. Run seed script first: npx ts-node scripts/seed-test-data.ts');
        process.exit(1);
    }
    console.log(`   ✅ Found case: ${testCase.caseNumber}`);
    console.log(`   📁 Type: ${testCase.caseType}`);
    console.log(`   👤 Client: ${testCase.client.name}`);
    console.log(`   💰 Medical Bills: $${testCase.financials?.totalMedicalBills?.toLocaleString() || 0}\n`);

    // 3. Run round table discussion
    console.log('3️⃣ Running round table discussion...');
    const testInput = `Client called asking about their case status and when they can expect a settlement. They're frustrated with the delay.`;
    console.log(`   📝 Input: "${testInput}"\n`);

    try {
        const result = await runRoundTableAndPersist(
            testCase._id.toString(),
            testInput,
            { type: InputSourceType.MANUAL, reference: 'integration-test' }
        );

        // 4. Display results
        console.log('4️⃣ Discussion Results:\n');
        console.log('='.repeat(60));
        console.log('ROUND TABLE TRANSCRIPT:');
        console.log('='.repeat(60));

        for (const msg of result.history) {
            console.log(`\n[${msg.role}]:`);
            console.log(msg.content.substring(0, 500) + (msg.content.length > 500 ? '...' : ''));
        }

        console.log('\n' + '='.repeat(60));
        console.log('ACTION CARD:');
        console.log('='.repeat(60));
        console.log(`\n📋 Title: ${result.card.title}`);
        console.log(`📝 Description: ${result.card.description}`);
        console.log(`🎯 Type: ${result.card.type}`);
        console.log(`📊 Confidence: ${(result.card.confidence * 100).toFixed(0)}%`);
        console.log(`\n💭 Reasoning:\n${result.card.reasoning}`);

        if (result.card.metadata?.emailBody) {
            console.log(`\n✉️ Email Draft:\n${result.card.metadata.emailBody}`);
        }

        // 5. Verify persistence
        console.log('\n' + '='.repeat(60));
        console.log('5️⃣ Verifying database persistence...');

        const savedAction = await Action.findById(result.actionId);
        if (savedAction) {
            console.log(`   ✅ Action saved to database: ${result.actionId}`);
            console.log(`   📁 Action Type: ${savedAction.actionType}`);
            console.log(`   📊 Status: ${savedAction.status}`);
            console.log(`   🎯 Priority: ${savedAction.priority}`);
            console.log(`   📝 Round Table Evidence: ${savedAction.aiAnalysis?.roundTable?.evidenceAnalyzerSays?.substring(0, 100)}...`);
        } else {
            console.log('   ❌ Action not found in database');
        }

        console.log('\n✅ Integration test complete!');

    } catch (error) {
        console.error('\n❌ Error during round table:', error);
        process.exit(1);
    }

    process.exit(0);
}

test().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

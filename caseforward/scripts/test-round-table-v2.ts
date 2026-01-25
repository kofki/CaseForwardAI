/**
 * Test Round Table V2
 * 
 * Tests the enhanced Round Table with multi-round discussions,
 * consensus detection, and action persistence.
 * 
 * Usage: npx ts-node --project tsconfig.json scripts/test-round-table-v2.ts
 */

// Load environment variables
import 'dotenv/config';

import { runRoundTable } from '../lib/agents/round-table-v2';
import connectDB from '../lib/db/connect';
import { Case } from '../lib/db/models';

async function main() {
  console.log('🔄 Testing Round Table V2...\n');

  try {
    await connectDB();

    // Find a test case
    const testCase = await Case.findOne({ status: { $ne: 'closed' } }).limit(1);

    if (!testCase) {
      console.error('❌ No test case found. Please seed some data first.');
      console.log('   Run: npx ts-node scripts/seed-test-data.ts');
      process.exit(1);
    }

    console.log(`📋 Using case: ${testCase.caseNumber}`);
    console.log(`   Client: ${testCase.client?.firstName} ${testCase.client?.lastName}`);
    console.log(`   Type: ${testCase.caseType}`);
    console.log(`   Status: ${testCase.status}\n`);

    // Test 1: Basic discussion
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 1: Basic Round Table Discussion');
    console.log('═══════════════════════════════════════════════════════════\n');

    const result1 = await runRoundTable(
      testCase._id.toString(),
      'Please analyze this case and recommend next steps. Focus on what documents we might be missing and what we should communicate to the client.',
      {
        config: {
          maxRounds: 2,
          persistActions: false, // Don't clutter DB for tests
          createAuditLog: false,
        },
      }
    );

    console.log(`📊 Session: ${result1.session.sessionId}`);
    console.log(`   Rounds completed: ${result1.session.rounds.length}`);
    console.log(`   Total messages: ${result1.session.rounds.reduce((sum, r) => sum + r.messages.length, 0)}`);
    console.log('');

    // Print round summary
    for (const round of result1.session.rounds) {
      console.log(`   Round ${round.roundNumber} (${round.phase}):`);
      for (const msg of round.messages) {
        const preview = msg.content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`     [${msg.role}]: ${preview}...`);
      }
      console.log('');
    }

    // Print consensus
    if (result1.session.consensus) {
      console.log('📈 Consensus Analysis:');
      console.log(`   Has Consensus: ${result1.session.consensus.hasConsensus}`);
      console.log(`   Agreement Level: ${(result1.session.consensus.agreementLevel * 100).toFixed(0)}%`);
      console.log(`   Shared Conclusions:`);
      for (const conclusion of result1.session.consensus.sharedConclusions.slice(0, 3)) {
        console.log(`     • ${conclusion}`);
      }
      if (result1.session.consensus.points_of_contention.length > 0) {
        console.log(`   Points of Contention:`);
        for (const point of result1.session.consensus.points_of_contention) {
          console.log(`     ⚠️ ${point}`);
        }
      }
      console.log('');
    }

    // Print action card
    console.log('🎴 Generated Action Card:');
    console.log(`   Title: ${result1.actionCard.title}`);
    console.log(`   Type: ${result1.actionCard.type}`);
    console.log(`   Confidence: ${(result1.actionCard.confidence * 100).toFixed(0)}%`);
    console.log(`   Description: ${result1.actionCard.description.substring(0, 200)}...`);
    console.log(`   Reasoning: ${result1.actionCard.reasoning.substring(0, 200)}...`);
    console.log('');

    // Test 2: Document-triggered analysis
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 2: Document-Triggered Analysis');
    console.log('═══════════════════════════════════════════════════════════\n');

    const sampleMedicalRecord = `
    PATIENT: ${testCase.client?.firstName} ${testCase.client?.lastName}
    DOB: 01/15/1985
    DATE OF SERVICE: 12/15/2025
    
    CHIEF COMPLAINT: Patient presents with neck pain and lower back pain following 
    motor vehicle accident on 11/30/2025.
    
    HISTORY: Patient was rear-ended at a red light. Airbags deployed. 
    Patient was wearing seatbelt. Immediate onset of neck and back pain.
    
    EXAMINATION:
    - Cervical spine: Decreased ROM, tenderness at C4-C6
    - Lumbar spine: Muscle spasm noted, tenderness at L4-L5
    
    DIAGNOSIS:
    - Cervical strain (S13.4)
    - Lumbar strain (S33.5)
    - Cervical disc displacement (M50.20)
    
    PLAN:
    - Physical therapy 3x/week for 6 weeks
    - MRI of cervical and lumbar spine recommended
    - Follow-up in 2 weeks
    - Prescription: Meloxicam 15mg daily
    
    CHARGES:
    Office visit: $250.00
    X-ray (cervical): $185.00
    X-ray (lumbar): $185.00
    TOTAL: $620.00
    `;

    const result2 = await runRoundTable(
      testCase._id.toString(),
      'New medical records received. Please analyze the document and determine next steps.',
      {
        documentText: sampleMedicalRecord,
        config: {
          maxRounds: 2,
          persistActions: false,
          createAuditLog: false,
        },
      }
    );

    console.log(`📊 Session: ${result2.session.sessionId}`);
    console.log(`   Rounds completed: ${result2.session.rounds.length}`);
    
    if (result2.session.consensus) {
      console.log(`\n📈 Consensus: ${(result2.session.consensus.agreementLevel * 100).toFixed(0)}% agreement`);
      console.log(`   Recommended: ${result2.session.consensus.recommendedAction}`);
    }

    console.log('\n🎴 Generated Action Card:');
    console.log(`   Title: ${result2.actionCard.title}`);
    console.log(`   Type: ${result2.actionCard.type}`);
    console.log(`   Confidence: ${(result2.actionCard.confidence * 100).toFixed(0)}%`);
    
    if (result2.actionCard.metadata?.emailBody) {
      console.log('\n📧 Drafted Email:');
      console.log('   ' + result2.actionCard.metadata.emailBody.substring(0, 300).replace(/\n/g, '\n   ') + '...');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

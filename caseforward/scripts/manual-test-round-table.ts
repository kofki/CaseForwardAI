/**
 * Manual Test for Round Table with Database Connection
 * 
 * Run with: GEMINI_API_KEY=... npx ts-node scripts/manual-test-round-table.ts
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { RoundTable } from '../lib/agents/round-table';
import connectToDatabase from '../lib/db/connect';
import Case from '../lib/db/models/Case';

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY is not set in the environment.');
        console.error('Please export it: export GEMINI_API_KEY=...');
        process.exit(1);
    }

    console.log("🔌 Connecting to database...");
    await connectToDatabase();

    // Get a test case
    const testCase = await Case.findOne({}).lean();
    if (!testCase) {
        console.error('❌ No cases found. Run seed script first: npx ts-node scripts/seed-test-data.ts');
        process.exit(1);
    }

    console.log(`✅ Found case: ${testCase.caseNumber} (${testCase.client.name})`);
    console.log("\nInitializing RoundTable...");
    const table = new RoundTable();

    const input = "Client sent an angry email about the invoice. They referenced a phone call from last Tuesday where they claim I promised a discount.";
    console.log(`\n--- Starting Discussion ---\nInput: "${input}"\n`);

    try {
        const result = await table.discussWithCase(testCase._id.toString(), input);

        console.log("\n--- Discussion History ---");
        result.history.forEach(msg => {
            console.log(`[${msg.role}]: ${msg.content.substring(0, 300)}...`);
        });

        console.log("\n--- Final Action Card ---");
        console.log(JSON.stringify(result.card, null, 2));

    } catch (error) {
        console.error("Error during discussion:", error);
    }

    process.exit(0);
}

main();



import { RoundTable } from '../lib/agents/round-table';

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY is not set in the environment.');
        console.error('Please export it: export GEMINI_API_KEY=...');
        process.exit(1);
    }

    console.log("Initializing RoundTable...");
    const table = new RoundTable();

    const input = "Client sent an angry email about the invoice. They referenced a phone call from last Tuesday where they claim I promised a discount.";
    console.log(`\n--- Starting Discussion ---\nInput: "${input}"\n`);

    try {
        const result = await table.discuss(input, { id: 'manual-test-case' });

        console.log("\n--- Discussion History ---");
        result.history.forEach(msg => {
            console.log(`[${msg.role}]: ${msg.content}`);
        });

        console.log("\n--- Final Action Card ---");
        console.log(JSON.stringify(result.card, null, 2));

    } catch (error) {
        console.error("Error during discussion:", error);
    }
}

main();

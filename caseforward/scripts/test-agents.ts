import { RoundTable } from '../lib/agents/round-table';

async function main() {
  const caseId = process.argv[2];
  const input = process.argv[3];

  if (!caseId || !input) {
    console.error('Usage: npm run test-agents <caseId> "<input question>"');
    process.exit(1);
  }

  console.log(`🤖 Starting RoundTable discussion for case ${caseId}...`);
  console.log(`📝 Input: "${input}"\n`);

  const roundTable = new RoundTable();
  const result = await roundTable.discussWithCase(caseId, input);

  console.log('\n=== DISCUSSION HISTORY ===');
  result.history.forEach((msg) => {
    console.log(`\n[${msg.role}]:`);
    console.log(msg.content);
  });

  console.log('\n\n=== ACTION CARD ===');
  console.log(JSON.stringify(result.card, null, 2));

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

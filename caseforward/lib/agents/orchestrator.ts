import { RoundTable } from './round-table';
import { ActionCard, AgentMessage } from './core/types';
import { CaseContext } from './services/case-context.service';

export interface OrchestratorResult {
  actionCard: ActionCard;
  discussionHistory: AgentMessage[];
  caseContext: CaseContext;
}

/**
 * Main entry point for the AI Orchestrator.
 * Routes the request to the Round Table for deliberation.
 */
export async function runOrchestrator(
  caseId: string,
  userInput: string
): Promise<OrchestratorResult> {
  const roundTable = new RoundTable();

  // In a more complex system, the Orchestrator check 'userInput' complexity
  // and decide whether to just call one specialist or convene the whole table.
  // For now, we always convene the Round Table.

  const result = await roundTable.discussWithCase(caseId, userInput);

  return {
    actionCard: result.card || {
      id: "default-no-action",
      originator: "ORCHESTRATOR",
      title: "No Action Recommended",
      description: "Based on the analysis, no specific action is required at this time.",
      type: "GENERAL",
      confidence: 0,
      reasoning: "No actionable insights were generated from the discussion."
    },
    discussionHistory: result.history,
    caseContext: result.caseContext
  };
}

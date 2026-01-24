import { orchestrateAnalysis, OrchestrationResult } from './orchestrator';
import { createAction } from '../db/models/Action';

export interface RoundTableResult {
  actionCard: OrchestrationResult['actionCard'];
  consensus: OrchestrationResult['consensus'];
  actionId: string;
}

export async function conductRoundTable(
  caseId: string,
  caseData: {
    title: string;
    description: string;
    metadata?: Record<string, any>;
  },
  userId?: string
): Promise<RoundTableResult> {
  // Orchestrator sets the stage
  const orchestrationResult = await orchestrateAnalysis(caseData);

  // Create action record
  const action = await createAction({
    caseId,
    type: orchestrationResult.actionCard.recommendation === 'approve' ? 'approve' : 
          orchestrationResult.actionCard.recommendation === 'reject' ? 'reject' : 'review',
    actionCard: orchestrationResult.actionCard,
    consensus: orchestrationResult.consensus,
    userId,
  });

  return {
    actionCard: orchestrationResult.actionCard,
    consensus: orchestrationResult.consensus,
    actionId: action._id!,
  };
}


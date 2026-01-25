import { NextRequest, NextResponse } from 'next/server';
import { runRoundTable, RoundTableResult } from '@/lib/agents/round-table-v2';

interface DiscussRequest {
  caseId: string;
  input: string;
  documentId?: string;
  documentText?: string;
  config?: {
    maxRounds?: number;
    persistActions?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscussRequest = await request.json();
    const { caseId, input, documentId, documentText, config } = body;

    if (!caseId || !input) {
      return NextResponse.json(
        { error: 'caseId and input are required' },
        { status: 400 }
      );
    }

    // Run the enhanced Round Table V2
    const result: RoundTableResult = await runRoundTable(caseId, input, {
      documentId,
      documentText,
      config: {
        maxRounds: config?.maxRounds ?? 2,
        persistActions: config?.persistActions ?? true,
        createAuditLog: true,
      },
    });

    // Flatten the discussion history from all rounds
    const allMessages = result.session.rounds.flatMap(round => round.messages);

    return NextResponse.json({
      success: true,
      
      // Session info
      sessionId: result.session.sessionId,
      roundsCompleted: result.session.rounds.length,
      
      // Consensus
      consensus: result.session.consensus,
      
      // Discussion transcript
      history: allMessages,
      
      // Final output
      actionCard: result.actionCard,
      actionId: result.session.persistedActionId,
      
      // Context
      caseContext: result.caseContext,
    });
  } catch (error: any) {
    console.error('Agent discussion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run discussion' },
      { status: 500 }
    );
  }
}

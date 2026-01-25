import { NextRequest, NextResponse } from 'next/server';
import { RoundTable } from '@/lib/agents/round-table';

export async function POST(request: NextRequest) {
  try {
    const { caseId, input } = await request.json();

    if (!caseId || !input) {
      return NextResponse.json(
        { error: 'caseId and input are required' },
        { status: 400 }
      );
    }

    const roundTable = new RoundTable();
    const result = await roundTable.discussWithCase(caseId, input);

    return NextResponse.json({
      success: true,
      history: result.history,
      actionCard: result.card,
      caseContext: result.caseContext
    });
  } catch (error: any) {
    console.error('Agent discussion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run discussion' },
      { status: 500 }
    );
  }
}

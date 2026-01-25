import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { logToSolana } from '@/lib/chain/solana-kanye';
import { getCaseById } from '@/lib/db/models/Case';
import { createAction } from '@/lib/db/models/Action';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { caseId, action } = await request.json();

    if (!caseId || !action) {
      return NextResponse.json({ error: 'Case ID and action are required' }, { status: 400 });
    }

    // Verify case exists
    const case_ = await getCaseById(caseId);
    if (!case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Log to Solana
    const solanaSignature = await logToSolana({
      caseId,
      action: action.type || 'approve',
      timestamp: new Date(),
      userId: session.user?.sub,
      metadata: {
        recommendation: action.recommendation,
        confidence: action.confidence,
      },
    });

    // Create action record
    const actionRecord = await createAction({
      caseId,
      type: action.recommendation === 'approve' ? 'approve' : 'review',
      actionCard: {
        recommendation: action.recommendation,
        reasoning: action.reasoning || '',
        confidence: action.confidence || 0,
      },
      consensus: {
        clientGuruOpinion: action.consensus?.clientGuruOpinion || '',
        evidenceAnalyzerOpinion: action.consensus?.evidenceAnalyzerOpinion || '',
        finalDecision: action.consensus?.finalDecision || '',
      },
      userId: session.user?.sub,
    });

    return NextResponse.json({
      success: true,
      actionId: actionRecord._id,
      solanaSignature,
    });
  } catch (error: any) {
    console.error('Audit logging error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}


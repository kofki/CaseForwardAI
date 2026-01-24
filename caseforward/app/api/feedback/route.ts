import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { createFeedback } from '@/lib/db/models/Feedback';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { caseId, comment, type } = await request.json();

    if (!caseId || !comment) {
      return NextResponse.json({ error: 'Case ID and comment are required' }, { status: 400 });
    }

    // Create feedback (typically for rejections/swipe left)
    const feedback = await createFeedback({
      caseId,
      type: type || 'rejection',
      comment,
      userId: session.user?.sub,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback._id,
    });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}


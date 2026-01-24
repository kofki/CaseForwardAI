import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { getCaseById } from '@/lib/db/models/Case';
import { conductRoundTable } from '@/lib/agents/round-table';

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const { caseId } = await request.json();

        if (!caseId) {
            return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
        }

        // Fetch the case
        const case_ = await getCaseById(caseId);
        if (!case_) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        // Conduct the round table analysis
        const result = await conductRoundTable(
            caseId,
            {
                title: case_.title,
                description: case_.description,
                metadata: case_.metadata,
            },
            session.user?.sub
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Agent orchestration error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth0';
import { getCaseById } from '@/lib/db/models/Case';
import { RoundTable } from '@/lib/agents/round-table';

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const { caseId, input } = await request.json();

        if (!caseId || !input) {
            return NextResponse.json({ error: 'caseId and input are required' }, { status: 400 });
        }

        // Fetch the case
        const case_ = await getCaseById(caseId);
        if (!case_) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        // Conduct the round table analysis
        const roundTable = new RoundTable();
        const result = await roundTable.discussWithCase(caseId, input);

        return NextResponse.json({
            success: true,
            history: result.history,
            actionCard: result.card,
            caseContext: result.caseContext
        });
    } catch (error: any) {
        console.error('Agent orchestration error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}


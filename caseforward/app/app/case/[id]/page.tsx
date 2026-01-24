import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getCaseById } from '@/lib/db/models/Case';
import { getActionsByCaseId } from '@/lib/db/models/Action';
import SwipeContainer from '@/components/SwipeContainer';
import CaseDetailClient from './CaseDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth0.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const case_ = await getCaseById(params.id);
  if (!case_) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h1>
          <a href="/app" className="text-blue-600 hover:underline">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  const actions = await getActionsByCaseId(params.id);

  return (
    <CaseDetailClient 
      case_={case_} 
      actions={actions}
      session={session}
    />
  );
}


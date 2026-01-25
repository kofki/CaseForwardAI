import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth0.getSession();
  
  if (session) {
    redirect('/app');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">CaseForward AI</h1>
        <p className="text-center text-gray-600 mb-8">AI-powered case management system</p>
        <a
          href="/auth/login"
          className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Login with Auth0
        </a>
      </div>
    </div>
  );
}

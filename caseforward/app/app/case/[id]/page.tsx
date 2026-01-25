import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { getCaseById } from "@/lib/db/models/Case";
import { getActionsByCaseId } from "@/lib/db/models/Action";
import CaseDetailClient from "./CaseDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Next.js 16: params is now a Promise
  const { id } = await params;

  const case_ = await getCaseById(id);
  if (!case_) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Case Not Found
          </h1>
          <a href="/app" className="text-blue-600 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const actions = await getActionsByCaseId(id);

  // IMPORTANT: Serialize Mongoose documents to plain objects to avoid
  // "Maximum call stack size exceeded" error during React serialization.
  // Mongoose documents contain circular references and non-serializable properties.
  const serializedCase = JSON.parse(JSON.stringify(case_.toObject()));
  const serializedActions = actions.map((action: any) =>
    JSON.parse(JSON.stringify(action.toObject ? action.toObject() : action))
  );
  const serializedSession = {
    user: {
      name: session.user?.name,
      email: session.user?.email,
    },
  };

  return (
    <CaseDetailClient
      case_={serializedCase}
      actions={serializedActions}
      session={serializedSession}
    />
  );
}


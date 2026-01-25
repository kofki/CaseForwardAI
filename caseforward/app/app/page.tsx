import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await dbConnect();
  const cases = await getCases();
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">CaseForward AI</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <a
                href="/auth/logout"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Review and manage your cases</p>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              No cases found. Cases will appear here once created.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((case_) => (
              <Link
                key={case_._id}
                href={`/app/case/${case_._id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {case_.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      case_.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : case_.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : case_.status === "reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {case_.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {case_.description}
                </p>
                <div className="text-xs text-gray-500">
                  Case #{case_.caseNumber}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(case_.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

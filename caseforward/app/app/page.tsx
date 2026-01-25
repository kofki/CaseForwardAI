import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Poppins, Radley } from "next/font/google";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth0.getSession();

  const userName = session?.user?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!session) {
    redirect("/auth/login");
  }

  let activeCases = 0;
  let archivedCases = 0;
  let caseList: any[] = [];
  let actionItems: any[] = [];
  let activityItems: any[] = [];

  try {
    await dbConnect();
    const cases = await getCases();

    activeCases = cases?.filter((c: any) => c.status !== "closed").length || 0;
    archivedCases =
      cases?.filter((c: any) => c.status === "closed").length || 0;

    // Use real cases data
    caseList =
      cases?.slice(0, 4).map((c: any) => ({
        caseNum: c.caseNumber,
        client:
          `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
        caseName: c.title || c.description || "Untitled Case",
        incidentDate: c.incidentDate
          ? new Date(c.incidentDate).toLocaleDateString()
          : "N/A",
      })) || [];

    actionItems =
      cases?.slice(0, 3).map((c: any) => ({
        caseNum: c.caseNumber,
        status:
          c.aiMetadata?.riskFlags?.length > 0
            ? "Action Required"
            : "Needs Review",
        action:
          c.aiMetadata?.nextSteps?.[0] ||
          `Review case details for ${c.client?.firstName || "client"}`,
      })) || [];

    activityItems =
      cases?.slice(0, 8).map((c: any) => ({
        time: c.aiMetadata?.lastProcessedAt
          ? new Date(c.aiMetadata.lastProcessedAt).toLocaleTimeString()
          : new Date(c.updatedAt).toLocaleTimeString(),
        action:
          c.aiMetadata?.summary ||
          `Case ${c.caseNumber}: ${c.client?.firstName} ${c.client?.lastName}`,
      })) || [];
  } catch (error) {
    console.error("Failed to load cases:", error);
    activeCases = 0;
    archivedCases = 0;
    caseList = [];
    actionItems = [];
    activityItems = [
      { time: "Error", action: "Failed to load cases from database" },
    ];
  }

  return (
    <div className="flex min-h-screen bg-[#f0ece6]">
      {/* Sidebar */}
      <aside
        className={`w-96 bg-[#4b1d1d] text-white p-8 flex flex-col ${poppins.className}`}
      >
        <div className="mb-8">
          <h1 className={`text-5xl font-bold ${radley.className}`}>
            CaseForward
          </h1>
        </div>

        {/* User Profile */}
        <div className="mt-6 pt-6 mb-6 pb-6 border-t border-b border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-200/90 via-amber-100 to-white/80 text-[#4b1d1d] font-semibold flex items-center justify-center text-xl ring-2 ring-white/40 shadow-lg">
              {userInitials}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{userName}</p>
              <p className="text-base text-white/80">{session.user?.email}</p>
            </div>
            <details className="relative inline-flex items-center group">
              <summary className="list-none text-white/80 hover:text-white text-2xl leading-none px-2 cursor-pointer select-none">
                ⋮
              </summary>
              <div className="absolute left-full ml-3 top-0 w-48 bg-white text-[#4b1d1d] rounded-lg shadow-xl ring-1 ring-black/5 opacity-0 translate-y-2 pointer-events-none transition duration-150 group-open:opacity-100 group-open:pointer-events-auto group-open:translate-y-0">
                <a
                  href="/api/auth/logout"
                  className="block px-4 py-3 text-base font-semibold hover:bg-[#f7f1eb] rounded-lg"
                >
                  Log Out
                </a>
              </div>
            </details>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-4 flex-1">
          <a
            href="/app"
            className="flex items-center gap-4 px-4 py-4 rounded hover:bg-white/10 text-2xl"
          >
            <span className="text-4xl">📊</span>
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-4 px-4 py-4 rounded hover:bg-white/10 text-2xl"
          >
            <span className="text-4xl">📁</span>
            <span>Cases</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-4 px-4 py-4 rounded hover:bg-white/10 text-2xl"
          >
            <span className="text-4xl">⚖️</span>
            <span>Priority Action Items</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-4 px-4 py-4 rounded hover:bg-white/10 text-2xl"
          >
            <span className="text-4xl">🤖</span>
            <span>AI Assistant Chatbot</span>
          </a>
        </nav>

        {/* Logout */}
        <a
          href="/api/auth/logout"
          className="flex items-center gap-4 px-4 py-4 rounded hover:bg-white/10 text-white/80 hover:text-white text-xl"
        >
          <span className="text-3xl">🚪</span>
          <span>Log Out</span>
        </a>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header with Stats */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/app/case/new"
            className="bg-[#f0a56b] text-[#4b1d1d] px-6 py-3 rounded font-semibold flex items-center gap-2 hover:bg-amber-400 text-lg"
          >
            <span>+</span> Register New Case
          </Link>
          <div className="flex gap-6">
            <div className="bg-white rounded-lg shadow px-6 py-4">
              <p className="text-base text-gray-600">Active Cases</p>
              <p className="text-4xl font-bold text-[#4b1d1d]">{activeCases}</p>
            </div>
            <div className="bg-white rounded-lg shadow px-6 py-4">
              <p className="text-base text-gray-600">Archived Cases</p>
              <p className="text-4xl font-bold text-[#4b1d1d]">
                {archivedCases}
              </p>
            </div>
          </div>
        </div>

        {/* Action Items Section */}
        <div className="mb-8">
          <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-3xl font-bold">Action Items</h2>
            <button className="text-base text-amber-200 hover:text-amber-100">
              View More
            </button>
          </div>
          <div className="bg-white rounded-b-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Case #
                  </th>
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Action Needed
                  </th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-base font-semibold text-gray-900">
                      {item.caseNum}
                    </td>
                    <td className="px-6 py-4 text-base">
                      <span
                        className={`px-3 py-1 rounded text-white text-sm font-semibold ${
                          item.status === "Needs Review"
                            ? "bg-red-500"
                            : "bg-orange-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      {item.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case List Section */}
        <div className="mb-8">
          <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-3xl font-bold">Case List</h2>
            <button className="text-base text-amber-200 hover:text-amber-100">
              View More
            </button>
          </div>
          <div className="bg-white rounded-b-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Case #
                  </th>
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Case Name
                  </th>
                  <th className="px-6 py-4 text-left text-base font-semibold text-gray-900">
                    Incident Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {caseList.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-base font-semibold text-gray-900">
                      {item.caseNum}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      {item.client}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      {item.caseName}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      {item.incidentDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div>
          <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-3xl font-bold">Activity Feed</h2>
            <button className="text-base text-amber-200 hover:text-amber-100">
              View All Activity
            </button>
          </div>
          <div className="bg-white rounded-b-lg shadow p-6">
            <div className="space-y-4">
              {activityItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <span className="text-green-500">✓</span>
                  <div>
                    <p className="text-base font-semibold text-gray-700">
                      {item.time}
                    </p>
                    <p className="text-base text-gray-600">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

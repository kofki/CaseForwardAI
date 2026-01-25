import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Radley } from "next/font/google";
import { CaseStatus } from "@/lib/db/types/enums";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import type { ICase } from "@/lib/db/models";
import SidebarClient from "@/components/SidebarClient";
import StatusBadge from "@/components/StatusBadge";

const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  let activeCases = 0;
  let archivedCases = 0;
  let caseList: {
    status: CaseStatus;
    id: string;
    caseNum: string;
    client: string;
    caseName: string;
    incidentDate: string;
  }[] = [];
  let actionItems: {
    id: string;
    caseNum: string;
    status: CaseStatus;
    action: string;
  }[] = [];
  let activityItems: { time: string; action: string }[] = [];
  let cases: ICase[] = [];

  try {
    await dbConnect();
    cases = (await getCases()) || [];

    activeCases =
      cases?.filter((c: ICase) => c.status !== CaseStatus.CLOSED).length || 0;
    archivedCases =
      cases?.filter((c: ICase) => c.status === CaseStatus.CLOSED).length || 0;

    // Use real cases data
    caseList =
      cases?.slice(0, 4).map((c: any) => ({
        id: c._id.toString(), // Add this line
        caseNum: c.caseNumber,
        status: c.status || CaseStatus.INTAKE, // Add this line
        client:
          `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
        caseName: c.title || c.description || "Untitled Case",
        incidentDate: c.incidentDate
          ? new Date(c.incidentDate).toLocaleDateString()
          : "N/A",
      })) || [];

    actionItems =
      cases?.slice(0, 3).map((c: ICase) => ({
        id: c._id?.toString?.() || c.caseNumber,
        caseNum: c.caseNumber,
        status: c.status || CaseStatus.INTAKE,
        action:
          c.aiMetadata?.nextSteps?.[0] ||
          `Review case details for ${c.client?.firstName || "client"}`,
      })) || [];

    activityItems =
      cases?.slice(0, 8).map((c: ICase) => ({
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
      <SidebarClient activePage="dashboard" />

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
            <h2 className={`text-3xl font-bold ${radley.className}`}>
              Action Items
            </h2>
            <Link
              href="/app/cases"
              className="text-base text-amber-200 hover:text-amber-100"
            >
              View More
            </Link>
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
                      <Link
                        href={`/app/case/${item.id}`}
                        className="text-[#4b1d1d] hover:underline"
                      >
                        {item.caseNum}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      <Link
                        href={`/app/case/${item.id}`}
                        className="text-[#4b1d1d] hover:underline"
                      >
                        {item.action}
                      </Link>
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
            <h2 className={`text-3xl font-bold ${radley.className}`}>
              Case List
            </h2>
            <Link
              href="/app/cases"
              className="text-base text-amber-200 hover:text-amber-100"
            >
              View More
            </Link>
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
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-base font-semibold text-gray-900">
                      <Link
                        href={`/app/case/${item.id}/documents`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {item.caseNum}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      <Link
                        href={`/app/case/${item.id}/documents`}
                        className="hover:text-blue-600"
                      >
                        {item.client}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      <Link
                        href={`/app/case/${item.id}/documents`}
                        className="hover:text-blue-600"
                      >
                        {item.caseName}
                      </Link>
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
            <h2 className={`text-3xl font-bold ${radley.className}`}>
              Activity Feed
            </h2>
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

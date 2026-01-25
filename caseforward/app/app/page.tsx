import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Radley } from "next/font/google";
import { CaseStatus } from "@/lib/db/types/enums";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import type { ICase } from "@/lib/db/models";
import SidebarClient from "@/components/SidebarClient";
import DashboardActionItems from "@/components/DashboardActionItems";
import DashboardCaseList from "@/components/DashboardCaseList";
import DashboardActivityFeed from "@/components/DashboardActivityFeed";
import NewCaseButton from "@/components/NewCaseButton";

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

    // Use real cases data - ensure id is always a string
    caseList =
      cases?.slice(0, 4).map((c: any) => {
        const caseIdStr = c._id ? c._id.toString() : "";
        return {
          id: caseIdStr,
          caseNum: c.caseNumber || "Unknown",
          status: c.status || CaseStatus.INTAKE,
          client:
            `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
          caseName:
            c.title ||
            c.incidentDescription?.substring(0, 50) ||
            "Untitled Case",
          incidentDate: c.incidentDate
            ? new Date(c.incidentDate).toLocaleDateString()
            : "N/A",
        };
      }) || [];

    actionItems =
      cases?.slice(0, 3).map((c: any) => {
        const caseIdStr = c._id ? c._id.toString() : "";
        return {
          id: caseIdStr,
          caseNum: c.caseNumber || "Unknown",
          status: c.status || CaseStatus.INTAKE,
          action:
            c.aiMetadata?.nextSteps?.[0] ||
            `Review case details for ${c.client?.firstName || "client"}`,
        };
      }) || [];

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
        {/* Header with Stats and Title */}
        <div className="mb-8 relative flex items-center justify-center">
          <div className="absolute left-0">
            <NewCaseButton />
          </div>

          {/* Dashboard Title */}
          <h2
            className={`text-7xl font-black text-[#4b1d1d] tracking-wide ${radley.className}`}
          >
            Dashboard
          </h2>

          <div className="absolute right-0 flex gap-6">
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

        {/* Action Items and Case List Side by Side */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <DashboardActionItems actionItems={actionItems} />
          <DashboardCaseList caseList={caseList} />
        </div>
        <DashboardActivityFeed activityItems={activityItems} />
      </main>
    </div>
  );
}

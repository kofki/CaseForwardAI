import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Radley } from "next/font/google";
import { CaseStatus } from "@/lib/db/types/enums";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import type { ICase } from "@/lib/db/models";
import SidebarClient from "@/components/SidebarClient";
import CaseListClient from "./CaseListClient";

const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  let activeCaseList: {
    status: CaseStatus;
    id: string;
    caseNum: string;
    client: string;
    caseName: string;
    incidentDate: string;
    email?: string;
    phone?: string;
  }[] = [];
  let archivedCaseList: {
    status: CaseStatus;
    id: string;
    caseNum: string;
    client: string;
    caseName: string;
    incidentDate: string;
    email?: string;
    phone?: string;
  }[] = [];

  try {
    await dbConnect();
    const cases = (await getCases()) || [];

    // Sort by most recent first
    const sortedCases = [...cases].sort((a: any, b: any) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    activeCaseList = sortedCases
      .filter((c: ICase) => c.status !== CaseStatus.CLOSED)
      .map((c: any) => ({
        id: c._id ? c._id.toString() : '',
        caseNum: c.caseNumber || 'Unknown',
        status: c.status || CaseStatus.INTAKE,
        client: `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
        caseName: c.title || c.incidentDescription?.substring(0, 50) || "Untitled Case",
        incidentDate: c.incidentDate ? new Date(c.incidentDate).toLocaleDateString() : "N/A",
        email: c.client?.email || '',
        phone: c.client?.phone || '',
      }));

    archivedCaseList = sortedCases
      .filter((c: ICase) => c.status === CaseStatus.CLOSED)
      .map((c: any) => ({
        id: c._id ? c._id.toString() : '',
        caseNum: c.caseNumber || 'Unknown',
        status: c.status || CaseStatus.CLOSED,
        client: `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
        caseName: c.title || c.incidentDescription?.substring(0, 50) || "Untitled Case",
        incidentDate: c.incidentDate ? new Date(c.incidentDate).toLocaleDateString() : "N/A",
        email: c.client?.email || '',
        phone: c.client?.phone || '',
      }));
  } catch (error) {
    console.error("Failed to load cases:", error);
  }

  return (
    <div className="flex min-h-screen bg-[#f0ece6]">
      <SidebarClient activePage="cases" />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/app" className="text-[#4b1d1d] hover:underline text-sm mb-2 inline-block">← Back to Dashboard</Link>
            <h1 className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}>All Cases</h1>
          </div>
          <Link
            href="/app/case/new"
            className="bg-[#f0a56b] text-[#4b1d1d] px-6 py-3 rounded font-semibold flex items-center gap-2 hover:bg-amber-400 text-lg"
          >
            <span>+</span> Register New Case
          </Link>
        </div>

        <CaseListClient activeCases={activeCaseList} archivedCases={archivedCaseList} />
      </main>
    </div>
  );
}

import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Poppins, Radley } from "next/font/google";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import { CaseStatus, CaseStatusLabels } from "@/lib/db/types/enums";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  await dbConnect();
  const cases = (await getCases()) || [];

  const rows = cases.map((c: any) => ({
    id: c._id?.toString?.() || c.id || c.caseNumber,
    caseNum: c.caseNumber || "—",
    client:
      `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
    caseName: c.title || c.description || "Untitled Case",
    incidentDate: c.incidentDate
      ? new Date(c.incidentDate).toLocaleDateString()
      : "N/A",
    status: c.status || CaseStatus.INTAKE,
  }));

  const statusColor: Record<string, string> = {
    [CaseStatus.INTAKE]: "bg-amber-600",
    [CaseStatus.INVESTIGATION]: "bg-blue-700",
    [CaseStatus.TREATMENT]: "bg-amber-700",
    [CaseStatus.DEMAND_PREP]: "bg-indigo-700",
    [CaseStatus.NEGOTIATION]: "bg-purple-700",
    [CaseStatus.LITIGATION]: "bg-rose-700",
    [CaseStatus.TRIAL]: "bg-red-700",
    [CaseStatus.SETTLED]: "bg-teal-700",
    [CaseStatus.CLOSED]: "bg-gray-600",
  };

  return (
    <div className={`min-h-screen bg-[#f0ece6] ${poppins.className}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[#4b1d1d]/80 uppercase tracking-[0.08em]">
              Cases
            </p>
            <h1
              className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}
            >
              All Cases
            </h1>
            <p className="text-sm text-[#4b1d1d]/70 mt-2">
              Browse every case and jump into details.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/app"
              className="px-4 py-2 border border-[#d7cfc3] text-[#4b1d1d] font-semibold hover:bg-[#f7f1eb]"
            >
              ← Dashboard
            </Link>
            <Link
              href="/app/case/new"
              className="px-4 py-2 bg-[#f0a56b] text-[#4b1d1d] font-semibold hover:bg-amber-400 shadow"
            >
              + New Case
            </Link>
          </div>
        </div>

        <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
          <div className="bg-[#4b1d1d] text-white px-6 py-4 flex items-center justify-between border-b border-white/15">
            <h2 className="text-2xl font-bold">Case List</h2>
            <span className="text-sm text-amber-200">{rows.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Case #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Case Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Incident Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-base font-semibold text-[#4b1d1d]">
                      <Link
                        href={`/app/case/${item.id}`}
                        className="hover:underline"
                      >
                        {item.caseNum}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-800">
                      <Link
                        href={`/app/case/${item.id}`}
                        className="hover:underline"
                      >
                        {item.client}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-800">
                      <Link
                        href={`/app/case/${item.id}`}
                        className="hover:underline"
                      >
                        {item.caseName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      <Link
                        href={`/app/case/${item.id}`}
                        className="hover:underline"
                      >
                        {item.incidentDate}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base">
                      <span
                        className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${
                          statusColor[item.status] || "bg-amber-600"
                        }`}
                      >
                        {CaseStatusLabels[item.status as CaseStatus] ||
                          item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-6 text-base text-gray-600"
                      colSpan={5}
                    >
                      No cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

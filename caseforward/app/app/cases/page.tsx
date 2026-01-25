import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Radley } from "next/font/google";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import type { ICase } from "@/lib/db/models";
import { CaseStatus } from "@/lib/db/types/enums";
import SidebarClient from "@/components/SidebarClient";
import StatusBadge from "@/components/StatusBadge";

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

  const rows = cases.map((c: ICase) => ({
    id: c._id?.toString?.() || c.caseNumber,
    caseNum: c.caseNumber || "—",
    client:
      `${c.client?.firstName || ""} ${c.client?.lastName || "Unknown"}`.trim(),
    caseName: c.title || c.description || "Untitled Case",
    incidentDate: c.incidentDate
      ? new Date(c.incidentDate).toLocaleDateString()
      : "N/A",
    status: c.status || CaseStatus.INTAKE,
  }));

  return (
    <div className="flex min-h-screen bg-[#f0ece6]">
      <SidebarClient activePage="cases" />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}
            >
              All Cases
            </h1>
            <p className="text-base text-[#4b1d1d]/70 mt-2">
              Browse every case and jump into details.
            </p>
          </div>
          <Link
            href="/app/case/new"
            className="bg-[#f0a56b] text-[#4b1d1d] px-6 py-3 rounded font-semibold hover:bg-amber-400 text-lg"
          >
            + New Case
          </Link>
        </div>

        <div className="bg-white shadow border border-[#e6ded3] overflow-hidden">
          <div className="bg-[#4b1d1d] text-white px-6 py-4 flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${radley.className}`}>
              Case List
            </h2>
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
                      <StatusBadge status={item.status} />
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
      </main>
    </div>
  );
}

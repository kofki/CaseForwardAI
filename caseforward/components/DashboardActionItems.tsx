import Link from "next/link";
import { Radley } from "next/font/google";
import { CheckCircle2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { CaseStatus } from "@/lib/db/types/enums";

const radley = Radley({ subsets: ["latin"], weight: "400" });

interface ActionItem {
  id: string;
  caseNum: string;
  status: CaseStatus;
  action: string;
}

interface DashboardActionItemsProps {
  actionItems: ActionItem[];
}

export default function DashboardActionItems({
  actionItems,
}: DashboardActionItemsProps) {
  return (
    <div className="mb-8">
      <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center border-l-4 border-[#f0a56b]">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-[#f0a56b]" />
          <h2 className={`text-3xl font-bold ${radley.className}`}>
            Action Items
          </h2>
        </div>
        <Link
          href="/app/cases"
          className="text-base text-amber-200 hover:text-amber-100"
        >
          View More
        </Link>
      </div>
      <div className="bg-gray-50 rounded-b-lg shadow overflow-hidden">
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
                className="border-b border-gray-100 hover:bg-white transition-colors duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 text-base font-semibold text-gray-900 truncate">
                  {item.id ? (
                    <Link
                      href={`/app/case/${item.id}/documents`}
                      className="text-[#4b1d1d] hover:underline truncate"
                    >
                      {item.caseNum}
                    </Link>
                  ) : (
                    <span className="truncate">{item.caseNum}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-base">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 text-base text-gray-700 truncate">
                  {item.id ? (
                    <Link
                      href={`/app/case/${item.id}/documents`}
                      className="text-[#4b1d1d] hover:underline truncate"
                    >
                      {item.action}
                    </Link>
                  ) : (
                    <span className="truncate">{item.action}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

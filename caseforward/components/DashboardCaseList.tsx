import Link from "next/link";
import { Radley } from "next/font/google";
import { FileText } from "lucide-react";

const radley = Radley({ subsets: ["latin"], weight: "400" });

interface CaseListItem {
  status: any;
  id: string;
  caseNum: string;
  client: string;
  caseName: string;
  incidentDate: string;
}

interface DashboardCaseListProps {
  caseList: CaseListItem[];
}

export default function DashboardCaseList({
  caseList,
}: DashboardCaseListProps) {
  return (
    <div className="mb-8">
      <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center border-l-4 border-[#f0a56b]">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-[#f0a56b]" />
          <h2 className={`text-3xl font-bold ${radley.className}`}>
            Case List
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
                className="border-b border-gray-100 hover:bg-white transition-colors duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 text-base font-semibold text-gray-900 truncate">
                  {item.id ? (
                    <Link
                      href={`/app/case/${item.id}/documents`}
                      className="hover:text-blue-600 hover:underline truncate"
                    >
                      {item.caseNum}
                    </Link>
                  ) : (
                    <span className="truncate">{item.caseNum}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-base text-gray-700 truncate">
                  {item.id ? (
                    <Link
                      href={`/app/case/${item.id}/documents`}
                      className="hover:text-blue-600 truncate"
                    >
                      {item.client}
                    </Link>
                  ) : (
                    <span className="truncate">{item.client}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-base text-gray-700 truncate">
                  {item.id ? (
                    <Link
                      href={`/app/case/${item.id}/documents`}
                      className="hover:text-blue-600 truncate"
                    >
                      {item.caseName}
                    </Link>
                  ) : (
                    <span className="truncate">{item.caseName}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-base text-gray-700 truncate">
                  {item.incidentDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

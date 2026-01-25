import Link from "next/link";
import { ICase } from "@/lib/db/models";
import StatusBadge from "./StatusBadge";
import { Poppins, Radley } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

interface CaseTableProps {
  cases: ICase[];
  title?: string;
  showActions?: boolean;
}

export default function CaseTable({
  cases,
  title = "Cases",
  showActions = false,
}: CaseTableProps) {
  return (
    <div>
      {title && (
        <h3 className={`text-3xl font-bold mb-6 ${radley.className}`}>
          {title}
        </h3>
      )}
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className={`w-full text-left text-lg ${poppins.className}`}>
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 font-semibold text-gray-700">
                Case Name
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Client</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Date Created
              </th>
              {showActions && (
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr
                key={caseItem._id.toString()}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/app/case/${caseItem._id}/documents`}
                    className="text-gray-900 hover:text-[#4b1d1d] font-semibold"
                  >
                    {caseItem.title || caseItem.caseNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <Link
                    href={`/app/case/${caseItem._id}/documents`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {`${caseItem.client.firstName} ${caseItem.client.lastName}`}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/app/case/${caseItem._id}/documents`}
                    className="hover:text-[#4b1d1d]"
                  >
                    <StatusBadge status={caseItem.status} />
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <Link
                    href={`/app/case/${caseItem._id}/documents`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </Link>
                </td>
                {showActions && (
                  <td className="px-6 py-4 text-gray-600">
                    <Link
                      href={`/app/case/${caseItem._id}/documents`}
                      className="text-[#4b1d1d] font-semibold hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

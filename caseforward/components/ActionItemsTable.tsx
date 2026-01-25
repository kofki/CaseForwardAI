import Link from "next/link";
import { Action } from "@/lib/db/models";
import StatusBadge from "./StatusBadge";
import { Poppins, Radley } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

interface ActionItemsTableProps {
  actions: Action[];
  title?: string;
}

export default function ActionItemsTable({
  actions,
  title = "Action Items",
}: ActionItemsTableProps) {
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
              <th className="px-6 py-4 font-semibold text-gray-700">Action</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Case</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr
                key={action._id.toString()}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-semibold text-gray-900">
                  <Link
                    href={`/app/case/${action.caseId}`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {action.actionText}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <Link
                    href={`/app/case/${action.caseId}`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {action.caseId?.toString()}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/app/case/${action.caseId}`}
                    className="hover:text-[#4b1d1d]"
                  >
                    <StatusBadge status={action.status} />
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <Link
                    href={`/app/case/${action.caseId}`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {new Date(action.dueDate).toLocaleDateString()}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

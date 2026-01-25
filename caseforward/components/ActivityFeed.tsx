import Link from "next/link";
import { Poppins, Radley } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

interface ActivityItem {
  id: string;
  caseId: string;
  caseName: string;
  activity: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
}

export default function ActivityFeed({
  activities,
  title = "Recent Activity",
}: ActivityFeedProps) {
  return (
    <div>
      {title && (
        <h3 className={`text-3xl font-bold mb-6 ${radley.className}`}>
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p
                  className={`text-lg font-semibold text-gray-900 ${poppins.className}`}
                >
                  <Link
                    href={`/app/case/${activity.caseId}/documents`}
                    className="hover:text-[#4b1d1d]"
                  >
                    {activity.caseName}
                  </Link>
                </p>
                <p className="text-gray-600 mt-1">{activity.activity}</p>
              </div>
              <p className="text-gray-500 text-sm ml-4 whitespace-nowrap">
                {new Date(activity.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

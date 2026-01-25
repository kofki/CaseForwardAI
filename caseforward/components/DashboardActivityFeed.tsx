import { Radley } from "next/font/google";
import { Activity } from "lucide-react";

const radley = Radley({ subsets: ["latin"], weight: "400" });

interface ActivityItem {
  time: string;
  action: string;
}

interface DashboardActivityFeedProps {
  activityItems: ActivityItem[];
}

export default function DashboardActivityFeed({
  activityItems,
}: DashboardActivityFeedProps) {
  return (
    <div>
      <div className="bg-[#4b1d1d] text-white p-4 rounded-t-lg flex justify-between items-center border-l-4 border-[#f0a56b]">
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-[#f0a56b]" />
          <h2 className={`text-3xl font-bold ${radley.className}`}>
            Activity Feed
          </h2>
        </div>
        <button className="text-base text-amber-200 hover:text-amber-100">
          View All Activity
        </button>
      </div>
      <div className="bg-gray-50 rounded-b-lg shadow p-6">
        <div className="space-y-4">
          {activityItems.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 hover:bg-white hover:rounded hover:px-3 hover:py-2 hover:mx-neg-3 transition-colors duration-150"
            >
              <span className="text-green-500">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-700 truncate">
                  {item.time}
                </p>
                <p className="text-base text-gray-600 truncate">
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

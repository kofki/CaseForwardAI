import Link from "next/link";
import { Poppins, Radley } from "next/font/google";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  MessageSquare,
  MoreVertical,
} from "lucide-react";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

interface SidebarProps {
  activePage?: "dashboard" | "cases" | "actions" | "chatbot";
  userName?: string;
  userEmail?: string;
  userInitials?: string;
}

export default function Sidebar({
  activePage,
  userName = "User",
  userEmail = "user@email.com",
  userInitials = "U",
}: SidebarProps) {
  return (
    <aside
      className={`w-96 bg-[#4b1d1d] text-white p-8 flex flex-col ${poppins.className}`}
    >
      <div className="mb-12">
        <h1 className={`text-5xl font-bold ${radley.className}`}>
          CaseForward
        </h1>
      </div>

      {/* Navigation */}
      <nav className={`space-y-2 flex-1 pt-8 ${radley.className}`}>
        <Link
          href="/app"
          className={`flex items-center gap-4 px-4 py-4 rounded text-2xl border-t border-white/10 ${
            activePage === "dashboard"
              ? "border-b-2 border-b-[#f0a56b] bg-white/20"
              : "border-b border-b-white/10 hover:bg-white/10"
          }`}
        >
          <LayoutDashboard size={26} className="flex-shrink-0" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/app/cases"
          className={`flex items-center gap-4 px-4 py-4 rounded text-2xl border-b-2 ${
            activePage === "cases"
              ? "border-[#f0a56b] bg-white/20"
              : "border-white/10 hover:bg-white/10"
          }`}
        >
          <FileText size={26} className="flex-shrink-0" />
          <span>Cases</span>
        </Link>
        <Link
          href="/app/swipe"
          className={`flex items-center gap-4 px-4 py-4 rounded text-2xl border-b-2 ${
            activePage === "actions"
              ? "border-[#f0a56b] bg-white/20"
              : "border-white/10 hover:bg-white/10"
          }`}
        >
          <CheckSquare size={26} className="flex-shrink-0" />
          <span>Priority Action Items</span>
        </Link>
        <Link
          href="/app/chatbot"
          className={`flex items-center gap-4 px-4 py-4 rounded text-2xl border-b-2 ${
            activePage === "chatbot"
              ? "border-[#f0a56b] bg-white/20"
              : "border-white/10 hover:bg-white/10"
          }`}
        >
          <MessageSquare size={26} className="flex-shrink-0" />
          <span>AI Assistant Chatbot</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-200/90 via-amber-100 to-white/80 text-[#4b1d1d] font-semibold flex items-center justify-center text-xl ring-2 ring-white/40 shadow-lg">
            {userInitials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{userName}</p>
            <p className="text-base text-white/80">{userEmail}</p>
          </div>
          <details className="relative inline-flex items-center group">
            <summary className="list-none text-white/80 hover:text-white leading-none px-2 cursor-pointer select-none">
              <MoreVertical size={24} />
            </summary>
            <div className="absolute left-full ml-3 top-0 w-48 bg-white text-[#4b1d1d] rounded-lg shadow-xl ring-1 ring-black/5 opacity-0 translate-y-2 pointer-events-none transition duration-150 group-open:opacity-100 group-open:pointer-events-auto group-open:translate-y-0">
              <a
                href="/api/auth/logout"
                className="block px-4 py-3 text-base font-semibold hover:bg-[#f7f1eb] rounded-lg"
              >
                Log Out
              </a>
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}

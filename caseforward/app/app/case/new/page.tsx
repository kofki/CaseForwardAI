import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Poppins, Radley } from "next/font/google";
import { FolderOpen, Upload, Link as LinkIcon } from "lucide-react";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });
const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className={`min-h-screen bg-[#f0ece6] ${poppins.className}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[#4b1d1d]/80 uppercase tracking-[0.08em]">
              Case Intake
            </p>
            <h1
              className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}
            >
              Register New Case
            </h1>
            <p className="text-sm text-[#4b1d1d]/70 mt-2">
              A clean, confident intake flow—built to feel calm and intentional.
            </p>
          </div>
          <Link
            href="/app"
            className="text-[#4b1d1d] hover:text-[#301010] font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="bg-white shadow border border-[#e6ded3] rounded-none">
            <div className="bg-[#4b1d1d] text-white px-6 py-4 rounded-none flex items-center justify-between border-b border-white/15">
              <div>
                <p className="text-sm text-amber-200">Case Details</p>
                <h2 className="text-2xl font-bold">Primary Information</h2>
              </div>
              <FolderOpen size={28} className="text-white" />
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Case Name
                  </span>
                  <input
                    type="text"
                    placeholder="CF-2026-001"
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Incident Date
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Client Name
                  </span>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Client Email
                  </span>
                  <input
                    type="email"
                    placeholder="jane.doe@example.com"
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#4b1d1d]">
                  Phone
                </span>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#4b1d1d]">
                  Case Summary
                </span>
                <textarea
                  rows={4}
                  placeholder="Briefly describe the incident, location, and key notes."
                  className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                />
              </label>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Priority
                  </span>
                  <select className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]">
                    <option>Standard</option>
                    <option>Urgent</option>
                    <option>Time Sensitive</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Link
                  href="/app"
                  className="px-5 py-3 rounded-none border border-[#d7cfc3] text-[#4b1d1d] font-semibold hover:bg-[#f7f1eb]"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  className="px-6 py-3 rounded-none bg-[#f0a56b] text-[#4b1d1d] font-semibold hover:bg-amber-400 shadow"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
              <div className="bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15">
                <div>
                  <p className="text-sm text-amber-200">Evidence</p>
                  <h3 className="text-xl font-bold">Upload Case File</h3>
                </div>
                <Upload size={24} className="text-white" />
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-700">
                  Attach PDFs, images, or documents relevant to this case.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#d7cfc3] bg-[#f7f1eb] rounded-none px-4 py-8 text-center cursor-pointer hover:border-[#f0a56b]">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Drop files here or click to browse
                  </span>
                  <span className="text-xs text-gray-600">
                    PDF, PNG, JPG up to 25 MB
                  </span>
                  <input type="file" className="hidden" multiple />
                </label>
              </div>
            </div>

            <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
              <div className="bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15">
                <div>
                  <p className="text-sm text-amber-200">Channels</p>
                  <h3 className="text-xl font-bold">Pull From Channel</h3>
                </div>
                <LinkIcon size={24} className="text-white" />
              </div>
              <div className="p-5 space-y-3">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Select Source
                  </span>
                  <select className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]">
                    <option>Email Intake</option>
                    <option>Slack Channel</option>
                    <option>Teams Channel</option>
                    <option>Google Drive</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">
                    Link or Identifier
                  </span>
                  <input
                    type="text"
                    placeholder="Paste channel link or ID"
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>
                <button className="w-full px-4 py-3 mt-1 rounded-none bg-[#f0a56b] text-[#4b1d1d] font-semibold hover:bg-amber-400 shadow">
                  Connect & Pull
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

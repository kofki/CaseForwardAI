import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Radley } from "next/font/google";
import dbConnect from "@/lib/db/dbConnect";
import { getCases } from "@/lib/db/models/Case";
import type { ICase } from "@/lib/db/models";
import SidebarClient from "@/components/SidebarClient";
import SwipeCardsComponent from "@/components/SwipeCardsComponent";

const radley = Radley({ subsets: ["latin"], weight: "400" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SwipePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  let cases: ICase[] = [];

  try {
    await dbConnect();
    cases = (await getCases()) || [];
  } catch (error) {
    console.error("Failed to load cases:", error);
    cases = [];
  }

  const cards = cases.map((c: ICase) => ({
    id: c._id?.toString?.() || c.caseNumber,
    caseNum: c.caseNumber || "Unknown",
    caseName:
      c.title || c.incidentDescription?.substring(0, 50) || "Untitled Case",
  }));

  return (
    <div className="flex min-h-screen bg-[#f0ece6]">
      <SidebarClient activePage="actions" />

      <main className="flex-1 p-8 flex flex-col">
        {/* Header */}
        <div className="mb-12">
          <h1
            className={`text-5xl font-black text-[#4b1d1d] ${radley.className}`}
          >
            Review Cases
          </h1>
          <p className="text-[#4b1d1d]/70 mt-2">
            Swipe through cases and take action
          </p>
        </div>

        {/* Swipe Cards */}
        <div className="flex-1 flex items-center justify-center">
          <SwipeCardsComponent cards={cards} />
        </div>
      </main>
    </div>
  );
}

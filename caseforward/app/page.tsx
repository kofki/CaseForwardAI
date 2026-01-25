import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Radley, Poppins } from "next/font/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const radley = Radley({ subsets: ["latin"], weight: "400" });
const poppins = Poppins({ subsets: ["latin"], weight: "500" });

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(20,12,10,0.7) 0%, rgba(20,12,10,0.7) 100%), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="bg-[#170909]/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-7 text-base uppercase tracking-wide">
          <div
            className={`text-4xl font-semibold text-white ${radley.className}`}
          >
            CaseForward
          </div>
          <nav
            className={`hidden items-center gap-9 md:flex ${poppins.className} tracking-[0.18em] text-[0.92rem]`}
          >
            <a className="hover:text-amber-200 transition" href="#home">
              Home
            </a>
            <a className="hover:text-amber-200 transition" href="#about">
              About
            </a>
            <a className="hover:text-amber-200 transition" href="#contact">
              Contact Us
            </a>
            <a className="hover:text-amber-200 transition" href="#services">
              Services
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/auth/login"
              className={`flex items-center rounded-md bg-white/15 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)] backdrop-blur transition hover:bg-white/25 ${poppins.className} tracking-[0.12em]`}
            >
              <span className="leading-none">Login</span>
            </a>
            <a
              href="/auth/signup"
              className={`flex items-center rounded-md bg-amber-300 px-5 py-3 text-sm font-semibold text-[#2b1a12] shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:bg-amber-200 ${poppins.className} tracking-[0.12em]`}
            >
              <span className="leading-none">Sign Up</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl space-y-6">
          <h1
            className={`text-5xl font-bold sm:text-6xl md:text-7xl ${radley.className}`}
          >
            AI-Powered
          </h1>
          <p className="text-2xl tracking-[0.25em] text-gray-100">
            Legal Assistant Platform
          </p>
          <a
            href="/auth/login"
            className="mt-6 inline-flex items-center justify-center rounded-full px-10 py-3 text-lg font-semibold text-[#2b1a12] shadow-lg transition transform hover:scale-105"
            style={{
              backgroundColor: "#f0a56b",
              boxShadow: "0 10px 30px rgba(240,165,107,0.35)",
            }}
          >
            Get Started
          </a>
        </div>
      </main>
    </div>
  );
}

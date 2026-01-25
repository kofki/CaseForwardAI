import Link from "next/link";

export default function NewCaseButton() {
  return (
    <Link
      href="/app/case/new"
      className="bg-[#f0a56b] text-[#4b1d1d] px-6 py-3 rounded font-semibold hover:bg-amber-400 text-lg flex-shrink-0"
    >
      + New Case
    </Link>
  );
}

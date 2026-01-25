import { CaseStatus, CaseStatusLabels } from "@/lib/db/types/enums";

const statusColors: Record<CaseStatus, string> = {
  [CaseStatus.INTAKE]: "bg-[#f0ece6] text-[#4b1d1d] border border-[#d7cfc3]",
  [CaseStatus.INVESTIGATION]: "bg-[#e8dfd4] text-[#4b1d1d] border border-[#c9bfb0]",
  [CaseStatus.TREATMENT]: "bg-[#f0a56b] text-white border border-[#e08d4a]",
  [CaseStatus.DEMAND_PREP]: "bg-[#fcd6b8] text-[#8b4513] border border-[#f0c097]",
  [CaseStatus.NEGOTIATION]: "bg-[#d4c5b5] text-[#4b1d1d] border border-[#b8a895]",
  [CaseStatus.LITIGATION]: "bg-[#6b2e2e] text-white border border-[#4b1d1d]",
  [CaseStatus.TRIAL]: "bg-[#8b3a3a] text-white border border-[#6b2e2e]",
  [CaseStatus.SETTLED]: "bg-[#c8d5b9] text-[#3d5a2f] border border-[#a8bb94]",
  [CaseStatus.CLOSED]: "bg-[#d7cfc3] text-[#6b5d4f] border border-[#b8aea0]",
};

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`px-4 py-2 rounded text-sm font-semibold ${statusColors[status]} ${className}`}
    >
      {CaseStatusLabels[status]}
    </span>
  );
}

import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
};

export default function StatsCard({ icon: Icon, value, label, color, delay = 0 }: StatsCardProps) {
  return (
    <div className="apple-card p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.02em] text-[#86868b]">{label}</p>
          <p className="text-[2rem] font-bold tracking-[-0.04em] text-white leading-none">{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}14`, boxShadow: `0 0 20px ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

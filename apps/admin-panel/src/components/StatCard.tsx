import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ icon: Icon, label, value, sub }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-2xl font-bold text-text glow-cyan">{value}</div>
          <div className="text-xs text-text-muted tracking-widest uppercase">{label}</div>
          {sub && <div className="text-[10px] text-text-muted/60 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

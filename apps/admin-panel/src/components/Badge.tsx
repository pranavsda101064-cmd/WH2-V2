const STYLES: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border border-primary/30',
  accent: 'bg-accent/10 text-accent border border-accent/30',
  success: 'bg-success/10 text-success border border-success/30',
  danger: 'bg-danger/10 text-danger border border-danger/30',
  warning: 'bg-warning/10 text-warning border border-warning/30',
  muted: 'bg-white/5 text-text-muted border border-white/10',
};

interface BadgeProps {
  variant?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'muted', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${STYLES[variant] || STYLES.muted} ${className}`}>
      {children}
    </span>
  );
}

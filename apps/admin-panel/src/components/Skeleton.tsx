export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-white/5 rounded animate-pulse"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-white/5 rounded animate-pulse"
                style={{ width: `${50 + Math.random() * 40}%`, animationDelay: `${r * 80 + c * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/5 rounded animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="h-3 w-32 bg-white/5 rounded animate-pulse mb-4" />
      <div className="h-[250px] flex items-end gap-1 px-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 rounded-t animate-pulse"
            style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative space-y-4">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
          <div className="h-10 w-full bg-white/5 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-10 w-full bg-primary/10 rounded animate-pulse" />
    </div>
  );
}

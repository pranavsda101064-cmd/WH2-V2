interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = '// NO DATA FOUND', icon }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <p className="text-text-muted tracking-widest text-sm">{message}</p>
    </div>
  );
}

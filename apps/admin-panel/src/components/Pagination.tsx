import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  totalLabel?: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, totalLabel = 'items', onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted tracking-wider">
        PAGE {page} / {pages} ({total} {totalLabel})
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

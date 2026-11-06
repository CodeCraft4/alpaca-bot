import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface OrdersPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white border-t border-brand-border">
      {/* Records count */}
      <span className="text-xs text-brand-muted">
        Showing <span className="font-semibold text-brand-text font-mono">{startItem}</span> to{' '}
        <span className="font-semibold text-brand-text font-mono">{endItem}</span> of{' '}
        <span className="font-semibold text-brand-text font-mono">{totalItems}</span> orders
      </span>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-colors ${
                currentPage === p
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


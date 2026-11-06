import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text tracking-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-brand-muted mt-1">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};


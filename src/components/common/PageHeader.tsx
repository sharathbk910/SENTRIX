import React, { ReactNode } from 'react';

export interface PageHeaderProps {
  badge?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5 ${className}`}>
      <div className="space-y-1">
        {badge && <div className="mb-1">{badge}</div>}
        <h1 className="text-2xl font-serif text-white tracking-tight font-normal">{title}</h1>
        {description && (
          <p className="text-xs text-[#9194A1] max-w-3xl leading-relaxed">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

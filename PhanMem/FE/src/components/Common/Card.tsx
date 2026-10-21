import React from 'react';
import type { HTMLAttributes } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  contentClassName?: string;
  headerActions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  contentClassName,
  headerActions,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`premium-card rounded-[20px] relative ${className}`}
      {...props}
    >
      {/* Card Header */}
      {(title || description || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 px-5 pb-1">
          <div className="space-y-0.5 shrink-0">
            {title && typeof title === 'string' ? (
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {description && typeof description === 'string' ? (
              <p className="text-xs text-slate-400 font-medium leading-normal">{description}</p>
            ) : (
              description
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* Card Content */}
      <div className={`rounded-b-[20px] ${contentClassName ?? "p-5 overflow-hidden"}`}>{children}</div>
    </div>
  );
};

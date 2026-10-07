import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  headerAction,
  title,
  subtitle,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-lg bg-[#181A20] border border-[#262B35] text-white transition-colors ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262B35]">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-[#9EAAA5] mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

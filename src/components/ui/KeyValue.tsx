import React from 'react';

interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}

export const KeyValue: React.FC<KeyValueProps> = ({ label, value, hint, className = '' }) => {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-[#262B35] text-xs ${className}`}>
      <div>
        <span className="text-[#9EAAA5]">{label}</span>
        {hint && <span className="block text-[10px] text-[#68756F]">{hint}</span>}
      </div>
      <div className="font-mono tabular-nums text-white font-medium text-right">
        {value}
      </div>
    </div>
  );
};

import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = ''
}: SegmentedControlProps<T>) {
  const py = size === 'sm' ? 'py-1 px-2.5 text-xs' : 'py-1.5 px-3 text-xs';

  return (
    <div className={`inline-flex items-center p-0.5 rounded-sm bg-[#151A18] border border-[#26302C] ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${py} font-medium rounded-xs transition-colors whitespace-nowrap ${
              isSelected
                ? 'bg-[#181D1B] text-[#8BCF45] shadow-xs border border-[#303936]'
                : 'text-[#9EAAA5] hover:text-[#E5ECE8] border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
  showText = true
}) => {
  const iconSizes = {
    sm: 'w-5 h-5 text-sm',
    md: 'w-7 h-7 text-base',
    lg: 'w-9 h-9 text-xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* CIRQ Circular Loop Monogram Glyph */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg viewBox="0 0 32 32" fill="none" className={iconSizes[size].split(' ')[0] + ' ' + iconSizes[size].split(' ')[1]}>
          {/* Circular loop ring */}
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="#262B35"
            strokeWidth="2.5"
          />
          {/* Active circular arc in --accent */}
          <path
            d="M 16 4 A 12 12 0 0 1 28 16"
            stroke="#E0FF20"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Loop entry arrow / bio-node */}
          <circle cx="28" cy="16" r="2.5" fill="#E0FF20" />
          {/* Inner core node */}
          <circle cx="16" cy="16" r="3.5" fill="#6B8547" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold tracking-tight text-white text-base font-mono">
              CIRQ
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#E0FF20] bg-[#E0FF20]/10 px-1.5 py-0.5 rounded-full border border-[#E0FF20]/30 font-semibold uppercase">
              BIO-LOOP
            </span>
          </div>
          <span className="text-[9px] text-[#9EAAA5] mt-0.5 tracking-wider font-mono uppercase">
            CIRQ BIO-SYSTEMS
          </span>
        </div>
      )}
    </div>
  );
};

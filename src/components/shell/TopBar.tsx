import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';

export const TopBar: React.FC = () => {
  const { setCommandPaletteOpen } = useSelectionStore();

  return (
    <header className="h-14 bg-[#121317] border-b border-[#262B35] flex items-center justify-between px-6 shrink-0 z-30">
      {/* Zone 1: Brand Wordmark with Leaf Emblem from image.png */}
      <NavLink
        to="/"
        className="transition-opacity hover:opacity-90"
      >
        <BrandLogo size="md" />
      </NavLink>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#9EAAA5]">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#E0FF20] font-semibold' : ''}`
          }
        >
          Overview
        </NavLink>
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#E0FF20] font-semibold' : ''}`
          }
        >
          Sector Map
        </NavLink>
        <NavLink
          to="/resources"
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#E0FF20] font-semibold' : ''}`
          }
        >
          Crops & Residue
        </NavLink>
        <NavLink
          to="/pathways"
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#E0FF20] font-semibold' : ''}`
          }
        >
          Bio-Pathways
        </NavLink>
        <NavLink
          to="/impact"
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#E0FF20] font-semibold' : ''}`
          }
        >
          Climate Impact
        </NavLink>
        <NavLink
          to="/demo"
          className={({ isActive }) =>
            `transition-colors hover:text-white ${isActive ? 'text-[#FFFF00] font-semibold' : ''}`
          }
        >
          Circularity Demo
        </NavLink>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#9EAAA5] hover:text-white bg-[#181A20] hover:bg-[#1E222B] border border-[#262B35] rounded-md transition-colors"
          title="Search CIRQ (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#E0FF20]" />
          <span className="hidden sm:inline">Search Sector...</span>
          <kbd className="hidden sm:inline text-[10px] font-mono text-[#68756F]">⌘K</kbd>
        </button>

        {/* Launch Demo CTA in signature #E0FF20 lime */}
        <NavLink
          to="/demo"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-md transition-colors whitespace-nowrap shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Launch Demo</span>
        </NavLink>
      </div>
    </header>
  );
};

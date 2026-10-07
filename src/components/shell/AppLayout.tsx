import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { CommandPalette } from '../ui/CommandPalette.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';

export const AppLayout: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useSelectionStore();

  return (
    <div className="min-h-screen bg-[#0B0D0D] text-[#E5ECE8] flex flex-col font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0B0D0D] relative">
          <Outlet />
        </main>
      </div>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

import { create } from 'zustand';

export interface SelectionState {
  selectedResourceId: string | null;
  selectedProcessorId: string | null;
  selectedPathwayId: string | null;
  selectedLoopId: string | null;
  selectedRegionCode: string | null;
  activeCategoryFilter: string;
  demoMode: boolean;
  commandPaletteOpen: boolean;

  setSelectedResource: (id: string | null) => void;
  setSelectedProcessor: (id: string | null) => void;
  setSelectedPathway: (id: string | null) => void;
  setSelectedLoop: (id: string | null) => void;
  setSelectedRegion: (code: string | null) => void;
  setActiveCategoryFilter: (category: string) => void;
  setDemoMode: (val: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedResourceId: 'res-rice-straw-up',
  selectedProcessorId: 'proc-up-biochar',
  selectedPathwayId: 'pw-biochar-pyrolysis',
  selectedLoopId: 'loop-ganga-biochar',
  selectedRegionCode: 'IND-UP',
  activeCategoryFilter: 'ALL',
  demoMode: false,
  commandPaletteOpen: false,

  setSelectedResource: (id) => set({ selectedResourceId: id }),
  setSelectedProcessor: (id) => set({ selectedProcessorId: id }),
  setSelectedPathway: (id) => set({ selectedPathwayId: id }),
  setSelectedLoop: (id) => set({ selectedLoopId: id }),
  setSelectedRegion: (code) => set({ selectedRegionCode: code }),
  setActiveCategoryFilter: (category) => set({ activeCategoryFilter: category }),
  setDemoMode: (val) => set({ demoMode: val }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  clearSelection: () => set({
    selectedResourceId: null,
    selectedProcessorId: null,
    selectedPathwayId: null,
    selectedLoopId: null
  })
}));

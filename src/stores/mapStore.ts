import { create } from 'zustand';

export interface MapViewport {
  lng: number;
  lat: number;
  zoom: number;
}

export interface MapLayersState {
  resources: boolean;
  processors: boolean;
  demand: boolean;
  routes: boolean;
  loops: boolean;
  clusters: boolean;
  satelliteOverlay: boolean;
}

export interface MapState {
  viewport: MapViewport;
  layers: MapLayersState;
  activeInspectNodeId: string | null;
  drawerOpen: boolean;

  setViewport: (viewport: Partial<MapViewport>) => void;
  toggleLayer: (layer: keyof MapLayersState) => void;
  setLayer: (layer: keyof MapLayersState, enabled: boolean) => void;
  setActiveInspectNode: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  resetViewport: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    lng: 80.9462,
    lat: 26.8467,
    zoom: 6
  },
  layers: {
    resources: true,
    processors: true,
    demand: true,
    routes: true,
    loops: true,
    clusters: true,
    satelliteOverlay: false
  },
  activeInspectNodeId: 'res-rice-straw-up',
  drawerOpen: false,

  setViewport: (vp) => set((s) => ({ viewport: { ...s.viewport, ...vp } })),
  toggleLayer: (l) => set((s) => ({ layers: { ...s.layers, [l]: !s.layers[l] } })),
  setLayer: (l, enabled) => set((s) => ({ layers: { ...s.layers, [l]: enabled } })),
  setActiveInspectNode: (id) => set({ activeInspectNodeId: id, drawerOpen: !!id }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  resetViewport: () => set({ viewport: { lng: 20.0, lat: 15.0, zoom: 2.5 } })
}));

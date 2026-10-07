/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/shell/AppLayout.tsx';

// Screen imports
import { OverviewScreen } from './features/overview/OverviewScreen.tsx';
import { MapScreen } from './features/map/MapScreen.tsx';
import { ResourcesListScreen } from './features/resources/ResourcesListScreen.tsx';
import { ResourceDetailScreen } from './features/resources/ResourceDetailScreen.tsx';
import { GraphScreen } from './features/graph/GraphScreen.tsx';
import { PathwaysScreen } from './features/pathways/PathwaysScreen.tsx';
import { SimulatorScreen } from './features/simulator/SimulatorScreen.tsx';
import { ProcessorsScreen } from './features/processors/ProcessorsScreen.tsx';
import { MatchingScreen } from './features/matching/MatchingScreen.tsx';
import { LogisticsScreen } from './features/logistics/LogisticsScreen.tsx';
import { ImpactScreen } from './features/impact/ImpactScreen.tsx';
import { AIServicesScreen } from './features/ai/AIServicesScreen.tsx';
import { DataObservatoryScreen } from './features/data/DataObservatoryScreen.tsx';
import { IntegrationsScreen } from './features/integrations/IntegrationsScreen.tsx';
import { ScenarioLabScreen } from './features/scenarios/ScenarioLabScreen.tsx';
import { CircularLoopsScreen } from './features/loops/CircularLoopsScreen.tsx';
import { ResearchScreen } from './features/research/ResearchScreen.tsx';
import { DemoScreen } from './features/demo/DemoScreen.tsx';
import { SystemScreen } from './features/system/SystemScreen.tsx';
import { SettingsScreen } from './features/settings/SettingsScreen.tsx';
import { RegionLayersScreen } from './features/settings/RegionLayersScreen.tsx';
import { ComponentGalleryScreen } from './features/dev/ComponentGalleryScreen.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewScreen />} />
            <Route path="map" element={<MapScreen />} />
            <Route path="resources" element={<ResourcesListScreen />} />
            <Route path="resources/:id" element={<ResourceDetailScreen />} />
            <Route path="graph" element={<GraphScreen />} />
            <Route path="pathways" element={<PathwaysScreen />} />
            <Route path="simulator" element={<SimulatorScreen />} />
            <Route path="processors" element={<ProcessorsScreen />} />
            <Route path="processors/:id" element={<ProcessorsScreen />} />
            <Route path="matching" element={<MatchingScreen />} />
            <Route path="logistics" element={<LogisticsScreen />} />
            <Route path="impact" element={<ImpactScreen />} />
            <Route path="ai" element={<AIServicesScreen />} />
            <Route path="ai/executions/:id" element={<AIServicesScreen />} />
            <Route path="data" element={<DataObservatoryScreen />} />
            <Route path="integrations" element={<IntegrationsScreen />} />
            <Route path="scenarios" element={<ScenarioLabScreen />} />
            <Route path="loops" element={<CircularLoopsScreen />} />
            <Route path="research" element={<ResearchScreen />} />
            <Route path="demo" element={<DemoScreen />} />
            <Route path="system" element={<SystemScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="settings/layers" element={<RegionLayersScreen />} />
            <Route path="__ui" element={<ComponentGalleryScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

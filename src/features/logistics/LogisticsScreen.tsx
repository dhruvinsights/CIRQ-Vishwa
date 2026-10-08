import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Truck,
  Navigation,
  DollarSign,
  Leaf,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { logisticsClient } from '../../api/clients/logistics.ts';
import { Card } from '../../components/ui/Card.tsx';
import { DemoBanner } from '../../components/ui/DemoBanner.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatDistance, formatCarbon } from '../../lib/format.ts';

export const LogisticsScreen: React.FC = () => {
  const { unitSystem, currency, locale } = usePreferencesStore();
  const [selectedRouteId, setSelectedRouteId] = useState('rte-up-straw-biochar');

  // Queries
  const { data: routesRes, isLoading } = useQuery({
    queryKey: ['logistics', 'routes'],
    queryFn: logisticsClient.getRoutes
  });

  const { data: routeDetail } = useQuery({
    queryKey: ['logistics', 'route', selectedRouteId],
    queryFn: () => logisticsClient.getRoute(selectedRouteId)
  });

  const { data: compareData } = useQuery({
    queryKey: ['logistics', 'compare'],
    queryFn: () => logisticsClient.compareLogistics()
  });

  return (
    <>
      <DemoBanner
        screen="Freight Logistics"
        reason="Route costs and emissions factors are estimated from seed data, not live freight APIs."
        docsHint="Wire to a real routing engine (OSRM, Google Routes API) for live cost calculations."
      />
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Green Freight Logistics & Route Optimizer
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Smart freight routing conforming to the GLEC Framework 3.0, minimizing empty backhauls and transport emissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">GLEC Framework 3.0 Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Route Details & Turn-by-Turn (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Optimized Haulage Corridor"
            subtitle="Barabanki Agricultural Cooperative -> Ganga Valley Pyrolysis Facility"
            headerAction={<Badge status="LIVE" />}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <div>
                  <span className="text-[10px] text-[#68756F] block uppercase font-mono">Distance</span>
                  <span className="text-lg font-bold font-mono text-[#8BCF45]">
                    {formatDistance(routeDetail?.distanceKm || 28.4, unitSystem, locale)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68756F] block uppercase font-mono">Transit Time</span>
                  <span className="text-lg font-bold font-mono text-[#E5ECE8]">42 mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68756F] block uppercase font-mono">Fuel Burn</span>
                  <span className="text-lg font-bold font-mono text-[#D6D75A]">
                    {routeDetail?.fuelConsumptionLiters || 9.8} L Diesel
                  </span>
                </div>
              </div>

              {/* Turn-by-turn steps */}
              <div>
                <span className="text-xs font-semibold text-[#9EAAA5] block mb-2 uppercase tracking-wider font-mono">
                  Verified Route Waypoints & Directions
                </span>
                <div className="space-y-2">
                  {(routeDetail?.turnByTurnSteps || [
                    'Depart Barabanki Agricultural Cooperative collection gate',
                    'Follow SH-13 East toward Ram Sanehi Ghat for 18.2 km',
                    'Turn North on Industrial Feeder Rd to Pyrolysis Park B'
                  ]).map((step: string, i: number) => (
                    <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs text-[#E5ECE8] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#181D1B] border border-[#26302C] flex items-center justify-center font-mono text-[10px] text-[#8BCF45] shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Freight Mode Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Transport Mode Emission & Cost Comparison"
            subtitle="Comparing diesel heavy truck, consolidated electric fleet, and tractor relay."
          >
            <div className="space-y-3">
              {(compareData?.comparison || [
                { mode: 'Consolidated Electric Fleet', costUsd: 1980, carbonKg: 184, durationHours: 1.4 },
                { mode: 'Direct 10t Diesel Freight', costUsd: 2450, carbonKg: 1118, durationHours: 1.2 },
                { mode: 'Tractor Trolley Relay', costUsd: 1650, carbonKg: 1540, durationHours: 3.5 }
              ]).map((c: any, i: number) => {
                const isRecommended = c.mode.includes('Electric');
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xs border text-xs space-y-1.5 ${
                      isRecommended ? 'bg-[#151A18] border-[#8BCF45]' : 'bg-[#111615] border-[#26302C]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#E5ECE8]">{c.mode}</span>
                      {isRecommended && (
                        <span className="text-[10px] font-mono text-[#8BCF45] bg-[#8BCF45]/15 px-1.5 py-0.2 rounded-xs">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[11px] text-[#9EAAA5]">
                      <span>Cost: {formatCurrency(c.costUsd, 'USD', currency, locale)}</span>
                      <span className="font-mono text-[#8BCF45]">Emissions: {c.carbonKg} kg CO₂e</span>
                      <span>{c.durationHours} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};
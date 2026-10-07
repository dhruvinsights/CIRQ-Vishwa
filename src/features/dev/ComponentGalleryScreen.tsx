import React, { useState } from 'react';
import { Card } from '../../components/ui/Card.tsx';
import { StatCard } from '../../components/ui/StatCard.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip.tsx';
import { Tabs } from '../../components/ui/Tabs.tsx';
import { SegmentedControl } from '../../components/ui/SegmentedControl.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, EmptyState, ErrorState, OfflineState } from '../../components/ui/States.tsx';

export const ComponentGalleryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('badges');
  const [segVal, setSegVal] = useState('A');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
          CIRQ Living Design Component Library (`/__ui`)
        </h1>
        <p className="text-xs text-[#9EAAA5] mt-0.5">
          Design system tokens derived directly from CIRQ specification and reference layouts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Badges and Chips */}
        <Card title="Source Provenance Badges (Live, Demo, Cached, Stale, Error)">
          <div className="flex flex-wrap gap-3">
            <Badge status="LIVE" />
            <Badge status="DEMO" />
            <Badge status="CACHED" />
            <Badge status="STALE" />
            <Badge status="ERROR" />
          </div>
        </Card>

        {/* Confidence Meters */}
        <Card title="Confidence & Evidence Meters (No bare scores)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfidenceMeter score={94} evidenceCount={8} freshness="Updated 10m ago" />
            <ConfidenceMeter score={68} evidenceCount={2} freshness="Inferred estimate" />
          </div>
        </Card>

        {/* Stat Cards */}
        <Card title="Stat Cards with Sparklines & Tick Axes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Biomass Metric"
              value="4,820"
              unit="t"
              caption="Harvest batch"
              trend={{ value: '+12%', positive: true }}
              status="LIVE"
            />
            <StatCard
              label="Carbon Metric"
              value="710.4"
              unit="tCO₂e"
              caption="Avoided burn"
              trend={{ value: 'Net sink', positive: true }}
              status="CACHED"
            />
            <StatCard
              label="Gate Value"
              value="$41,280"
              caption="Spot offtake"
              status="DEMO"
            />
          </div>
        </Card>

        {/* Segmented Controls & Tabs */}
        <Card title="Segmented Controls & Functional Tabs">
          <div className="space-y-4">
            <SegmentedControl
              options={[
                { value: 'A', label: 'Option Alpha' },
                { value: 'B', label: 'Option Beta' },
                { value: 'C', label: 'Option Gamma' }
              ]}
              value={segVal}
              onChange={setSegVal}
            />

            <Tabs
              tabs={[
                { id: 't1', label: 'Feedstock Analysis', count: 12 },
                { id: 't2', label: 'Technology Routes', count: 4 },
                { id: 't3', label: 'Logistics Haulage' }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </Card>

        {/* 7 Standard UI States */}
        <Card title="Standard State Matrix (Empty, Error, Offline, Loading)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EmptyState
              title="Empty State Component"
              description="No data matching current filter criteria."
              action={{ label: 'Reset Filter', onClick: () => {} }}
            />
            <ErrorState
              title="Error State Component"
              message="The requested remote endpoint failed."
              requestId="req-test-99"
              onRetry={() => {}}
            />
            <OfflineState onReconnect={() => {}} />
          </div>
        </Card>
      </div>
    </div>
  );
};

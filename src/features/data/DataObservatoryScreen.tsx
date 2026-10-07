import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, ShieldCheck, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { dataClient } from '../../api/clients/data.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

export const DataObservatoryScreen: React.FC = () => {
  const { data: sourcesRes, isLoading, error, refetch } = useQuery({
    queryKey: ['data', 'sources'],
    queryFn: dataClient.getDataSources
  });

  const sources = sourcesRes?.sources || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            External Data Observatory & Provenance Registry
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Ingestion status, coverage boundaries, licensing constraints, and freshness audits for all global providers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Feeds: {sources.length}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load data observatory feeds"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sources.map((src) => (
            <Card
              key={src.id}
              title={src.name}
              subtitle={src.provider}
              headerAction={<Badge status={src.status} />}
            >
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#151A18] rounded-xs font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Records</span>
                    <span className="text-[#8BCF45] font-semibold">{src.records.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Quality Audit</span>
                    <span className="text-[#E5ECE8] font-semibold">{src.qualityScore}/100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Type</span>
                    <span className="text-[#D6D75A] font-semibold truncate block">{src.type}</span>
                  </div>
                </div>

                <KeyValue label="Geographic & Spectral Coverage" value={src.coverage} />
                <KeyValue label="Update Cadence / Freshness" value={src.freshness} />
                <KeyValue label="Data License" value={src.license} />
                <KeyValue label="Last Synchronization Timestamp" value={new Date(src.lastSync).toLocaleString()} />
                <KeyValue label="API Ingestion Endpoint" value={<code className="text-[#6DA8C8]">{src.endpoint}</code>} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

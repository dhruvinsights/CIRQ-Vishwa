import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cable,
  Activity,
  CheckCircle,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { integrationClient } from '../../api/clients/integration.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

export const IntegrationsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const { data: intRes, isLoading, error, refetch } = useQuery({
    queryKey: ['integrations', 'list'],
    queryFn: integrationClient.getIntegrations
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => integrationClient.testIntegration(id),
    onSuccess: (data) => {
      setTestNotice(`Connection ping succeeded! Latency: ${data.latencyMs}ms (200 OK)`);
      setTimeout(() => setTestNotice(null), 4000);
    }
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => integrationClient.syncIntegration(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setTestNotice(`Sync completed! Consumed ${data.newRecords} new observation records.`);
      setTimeout(() => setTestNotice(null), 4000);
    }
  });

  const integrations = intRes?.integrations || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            AgriFoodData & External Integration Hub
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Active service adapters connecting NaLamKI Farm Twin, OGC SensorThings, ESA Copernicus, and FAO databases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Connectors: {integrations.length}</span>
        </div>
      </div>

      {testNotice && (
        <div className="p-3 bg-[#151A18] border border-[#8BCF45]/40 text-xs text-[#8BCF45] rounded-xs flex items-center justify-between">
          <span>{testNotice}</span>
          <button onClick={() => setTestNotice(null)} className="text-[#68756F] hover:text-[#E5ECE8]">✕</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load integration adapters"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-sm bg-[#111615] border border-[#26302C] text-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#E5ECE8]">{item.name}</h4>
                    <Badge status={item.status} />
                  </div>
                  <span className="text-xs text-[#9EAAA5] mt-0.5 block">{item.service}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testMutation.mutate(item.id)}
                    disabled={testMutation.isPending}
                    className="px-2.5 py-1 bg-[#151A18] hover:bg-[#181D1B] border border-[#26302C] text-[#E5ECE8] rounded-xs"
                  >
                    Test Latency
                  </button>
                  <button
                    onClick={() => syncMutation.mutate(item.id)}
                    disabled={syncMutation.isPending}
                    className="px-2.5 py-1 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] font-semibold rounded-xs"
                  >
                    Trigger Sync
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2.5 bg-[#151A18] rounded-xs font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[#68756F] block">Latency</span>
                  <span className="text-[#8BCF45]">{item.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68756F] block">Synchronized Records</span>
                  <span className="text-[#E5ECE8]">{item.recordsCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68756F] block">Error Rate</span>
                  <span className="text-[#D6D75A]">{item.errorRate * 100}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68756F] block">License</span>
                  <span className="text-[#6DA8C8]">{item.license}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#68756F]">
                <div>Endpoint: <code className="text-[#9EAAA5]">{item.endpoint}</code></div>
                <div>Last Synchronized: {new Date(item.lastSync).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

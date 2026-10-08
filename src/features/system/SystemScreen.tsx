import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw, Database, Cpu, Globe, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { request } from '../../api/client.ts';
import { systemClient } from '../../api/clients/system.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

const ProbeRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const isOk = value.includes('OK') || value.includes('CONFIGURED') || value.includes('UP');
  const isError = value.includes('ERROR') || value.includes('NOT_CONFIGURED');
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#26302C]/60 text-xs">
      <span className="text-[#9EAAA5] capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
      <span className={`font-mono ${isOk ? 'text-[#8BCF45]' : isError ? 'text-[#D64545]' : 'text-[#D6D75A]'}`}>
        {value}
      </span>
    </div>
  );
};

export const SystemScreen: React.FC = () => {
  const { data: healthLive, isLoading: liveLoading } = useQuery({
    queryKey: ['health', 'live'],
    queryFn: systemClient.getHealthLive,
  });

  const { data: healthReady, isLoading: readyLoading, error: readyError, refetch } = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => request<any>('/health/ready'),
    refetchInterval: 30_000,
  });

  const checks = healthReady?.checks || {};
  const overallStatus = healthReady?.status || 'UNKNOWN';
  const uptimeSec = checks.uptimeSeconds ?? healthLive?.uptimeSeconds;
  const uptimeMin = uptimeSec != null ? Math.round(uptimeSec / 60) : null;
  const ragChunks = checks.ragChunks;
  const vectorBackend = checks.vectorStoreBackend || 'chroma';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            System Health & Service Probes
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Live readiness checks for the vector store, LLM provider, and farm API. Refreshes every 30 s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={overallStatus === 'UP' ? 'LIVE' : overallStatus === 'DEGRADED' ? 'STALE' : 'ERROR'} />
          <span className="text-xs font-mono text-[#68756F]">cirq-backend</span>
          <button onClick={() => refetch()} className="text-[#68756F] hover:text-[#E5ECE8] ml-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
          <span className="text-[10px] font-mono uppercase text-[#9EAAA5] block">Liveness</span>
          <span className={`text-lg font-bold font-mono block my-1 ${healthLive?.status === 'UP' ? 'text-[#8BCF45]' : 'text-[#D6D75A]'}`}>
            {liveLoading ? '…' : (healthLive?.status || '—')}
          </span>
          <span className="text-[11px] text-[#68756F]">
            {uptimeMin != null ? `Uptime: ${uptimeMin} min` : 'Uptime unknown'}
          </span>
        </div>

        <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
          <span className="text-[10px] font-mono uppercase text-[#9EAAA5] block">Vector Store</span>
          <span className="text-lg font-bold font-mono text-[#8BCF45] block my-1 uppercase">
            {readyLoading ? '…' : vectorBackend}
          </span>
          <span className="text-[11px] text-[#68756F]">
            {ragChunks && ragChunks !== 'UNKNOWN' ? `${ragChunks} chunks indexed` : 'No chunks yet — run ingest'}
          </span>
        </div>

        <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
          <span className="text-[10px] font-mono uppercase text-[#9EAAA5] block">LLM Provider</span>
          <span className="text-lg font-bold font-mono text-[#8BCF45] block my-1 truncate">
            {readyLoading ? '…' : (checks.llm ? checks.llm.split(':')[0].toUpperCase() : '—')}
          </span>
          <span className="text-[11px] text-[#68756F]">
            {checks.llm?.includes('CONFIGURED') && !checks.llm?.includes('NOT') ? 'Configured' : 'Not configured'}
          </span>
        </div>

        <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
          <span className="text-[10px] font-mono uppercase text-[#9EAAA5] block">Farm API</span>
          <span className={`text-lg font-bold font-mono block my-1 ${checks.farmApi === 'CONFIGURED' ? 'text-[#8BCF45]' : 'text-[#D6D75A]'}`}>
            {readyLoading ? '…' : (checks.farmApi === 'CONFIGURED' ? 'LIVE' : 'NOT SET')}
          </span>
          <span className="text-[11px] text-[#68756F]">
            {checks.farmApi === 'CONFIGURED' ? 'AgriFoodData connected' : 'Set FARM_API_BASE_URL'}
          </span>
        </div>
      </div>

      {readyError ? (
        <ErrorState title="Cannot reach backend" message={(readyError as any).message} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Service Probe Results" subtitle="Live /health/ready response — not cached">
            {readyLoading ? <Skeleton className="h-40" /> : (
              <div>
                {Object.entries(checks).map(([k, v]) => (
                  <ProbeRow key={k} label={k} value={String(v)} />
                ))}
              </div>
            )}
          </Card>

          <Card title="Vector Store Configuration">
            <KeyValue label="Active backend" value={vectorBackend.toUpperCase()} />
            <KeyValue label="Chunks indexed" value={ragChunks && ragChunks !== 'UNKNOWN' ? ragChunks : '0 — run ingest'} />
            <KeyValue label="Ingest endpoint" value="POST /api/v1/knowledge/ingest" />
            <KeyValue label="Corpus directory" value="backend/corpus/" />
            <KeyValue label="Switch backend" value="Settings → Vector Store" />
            <div className="mt-3 p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-[11px] text-[#9EAAA5]">
              ChromaDB persists to <code className="text-[#8BCF45] font-mono">.chroma/</code> locally.
              Switch to Db2 in Settings when you have a Db2 12.1.2+ instance.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

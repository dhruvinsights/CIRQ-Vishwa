import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Play,
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Code,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { aiClient } from '../../api/clients/ai.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { KnowledgeAssistant } from './KnowledgeAssistant.tsx';

export const AIServicesScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedServiceId, setSelectedServiceId] = useState('srv-semantic-resolver');
  const [inspectExecId, setInspectExecId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Queries
  const { data: servicesRes, isLoading: srvLoading } = useQuery({
    queryKey: ['ai', 'services'],
    queryFn: aiClient.getServices
  });

  const { data: selectedService } = useQuery({
    queryKey: ['ai', 'service', selectedServiceId],
    queryFn: () => aiClient.getService(selectedServiceId)
  });

  const { data: executionsRes } = useQuery({
    queryKey: ['ai', 'executions'],
    queryFn: aiClient.getExecutions
  });

  const { data: inspectedTrace } = useQuery({
    queryKey: ['ai', 'trace', inspectExecId],
    queryFn: () => aiClient.getExecutionTrace(inspectExecId!),
    enabled: !!inspectExecId
  });

  // Schema-driven execute mutation
  const executeMutation = useMutation({
    mutationFn: (payload: any) => aiClient.executeService(selectedServiceId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'executions'] });
      setInspectExecId(data.id);
    }
  });

  const services = servicesRes?.services || [];
  const executions = executionsRes?.executions || [];

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    executeMutation.mutate(formValues);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            AI Services Registry & Execution Traces
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Schema-driven circular intelligence services compliant with the NaLamKI AI Service Specification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Services: {services.length}</span>
        </div>
      </div>

      <KnowledgeAssistant />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Service Registry List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card title="Registered AI Services" subtitle="Click to inspect schema and test execution.">
            <div className="space-y-2">
              {services.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setFormValues({});
                    }}
                    className={`p-3 rounded-xs border cursor-pointer transition-all ${
                      isSelected ? 'bg-[#151A18] border-[#8BCF45]' : 'bg-[#111615] border-[#26302C] hover:border-[#303936]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-[#E5ECE8]">{s.name}</h4>
                      <span className="text-[10px] font-mono text-[#8BCF45]">{s.health}</span>
                    </div>
                    <p className="text-[11px] text-[#9EAAA5] line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#68756F] mt-2 font-mono">
                      <span>Avg: {s.avgLatencyMs}ms</span> · <span>Calls: {s.executionsCount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Center: Schema-Driven Form & Execution Trigger (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Schema-Driven Test Runner"
            subtitle={`Dynamic form built from ${selectedService?.name || 'Service'} JSON Schema`}
          >
            {selectedService ? (
              <form onSubmit={handleExecute} className="space-y-3 text-xs">
                {/* Dynamically render inputs based on JSON schema properties */}
                {Object.entries(selectedService.schema?.properties || {}).map(([key, prop]: [string, any]) => (
                  <div key={key}>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">
                      {prop.title || key}:
                    </label>
                    {prop.enum ? (
                      <select
                        value={formValues[key] || prop.default || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
                      >
                        {prop.enum.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : prop.type === 'number' ? (
                      <input
                        type="number"
                        value={formValues[key] ?? prop.default ?? 100}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={prop.description || `Enter ${key}...`}
                        className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={executeMutation.isPending}
                  className="w-full mt-2 py-2 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] font-semibold rounded-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{executeMutation.isPending ? 'Executing Service...' : 'Execute AI Service'}</span>
                </button>
              </form>
            ) : (
              <Skeleton className="h-48" />
            )}
          </Card>
        </div>

        {/* Right: Executions History & Traces (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Execution Traces"
            subtitle="Deterministic operational step-by-step logs."
          >
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {executions.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => setInspectExecId(ex.id)}
                  className={`p-2.5 rounded-xs border text-xs cursor-pointer transition-colors ${
                    inspectExecId === ex.id ? 'bg-[#151A18] border-[#8BCF45]' : 'bg-[#111615] border-[#26302C] hover:bg-[#151A18]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-[#8BCF45]">{ex.id}</span>
                    <span className="text-[10px] text-[#68756F] font-mono">{ex.durationMs}ms</span>
                  </div>
                  <div className="text-[11px] text-[#E5ECE8] truncate">{ex.inputRef}</div>
                  <div className="text-[10px] text-[#9EAAA5] mt-1 flex justify-between">
                    <span>{ex.dataSources.join(', ')}</span>
                    <span className="font-mono text-[#8BCF45]">{ex.confidence}% conf</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Trace Timeline Inspection Drawer */}
      <Drawer
        isOpen={!!inspectExecId}
        onClose={() => setInspectExecId(null)}
        title={`Execution Trace: ${inspectExecId}`}
        subtitle={inspectedTrace?.serviceId}
      >
        {inspectedTrace && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#26302C]">
              <span className="font-mono text-xs text-[#8BCF45]">{inspectedTrace.status}</span>
              <span className="font-mono text-xs text-[#9EAAA5]">Duration: {inspectedTrace.durationMs}ms</span>
            </div>

            <ConfidenceMeter
              score={inspectedTrace.confidence}
              evidenceCount={inspectedTrace.dataSources.length}
              freshness="Deterministic Execution Trace"
            />

            <div>
              <span className="text-xs font-semibold text-[#9EAAA5] block mb-2 uppercase font-mono">
                Step-by-Step Execution Sequence
              </span>
              <div className="space-y-2">
                {inspectedTrace.trace.map((step, i) => (
                  <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs flex justify-between items-center">
                    <div>
                      <span className="text-[#E5ECE8] font-medium">{step.step}</span>
                      <span className="text-[10px] text-[#68756F] block mt-0.5">Status: {step.status}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#8BCF45]">{step.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#9EAAA5] block mb-1">Grounding Data Sources</span>
              <div className="flex flex-wrap gap-1">
                {inspectedTrace.dataSources.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-[#151A18] border border-[#26302C] text-[#E5ECE8] rounded-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

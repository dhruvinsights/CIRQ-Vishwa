import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Sliders, Globe, DollarSign, Cpu, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { usePreferencesStore, UnitSystem, CurrencyCode, UserRole } from '../../stores/preferencesStore.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../../api/client.ts';

interface VectorStoreResponse {
  vectorStore: 'chroma' | 'db2';
  chromaPersistDir: string | null;
  db2Configured: boolean;
  status: string;
  chunksIndexed: number | null;
  availableBackends: string[];
}

interface LLMSettingsResponse {
  llmProvider: 'ollama' | 'gemini' | 'watsonx';
  isConfigured: boolean;
  ollama: {
    baseUrl: string;
    embeddingModel: string;
    chatModel: string;
  };
  gemini: {
    hasApiKey: boolean;
    embeddingModel: string;
    chatModel: string;
  };
  watsonx: {
    url: string;
    hasApiKey: boolean;
    projectId: string;
    embeddingModel: string;
    chatModel: string;
  };
  productionRecommendation: {
    provider: string;
    reason: string;
    recommendedModels: {
      chat: string;
      embedding: string;
    };
  };
}

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    unitSystem,
    setUnitSystem,
    currency,
    setCurrency,
    locale,
    setLocale,
    role,
    setRole,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion
  } = usePreferencesStore();

  const queryClient = useQueryClient();
  const [savedNotice, setSavedNotice] = useState(false);
  const [vsSwitchNotice, setVsSwitchNotice] = useState<string | null>(null);
  const [selectedVsBackend, setSelectedVsBackend] = useState<'chroma' | 'db2'>('chroma');

  // Vector store query
  const { data: vsData, isLoading: vsLoading, refetch: vsRefetch } = useQuery<VectorStoreResponse>({
    queryKey: ['settings-vector-store'],
    queryFn: () => request<VectorStoreResponse>('/settings/vector-store'),
    onSuccess: (d: VectorStoreResponse) => setSelectedVsBackend(d.vectorStore),
  } as any);

  const switchVsMutation = useMutation({
    mutationFn: (backend: string) => request('/settings/vector-store', { method: 'POST', body: JSON.stringify({ vectorStore: backend }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-vector-store'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setVsSwitchNotice(`Switched to ${selectedVsBackend.toUpperCase()}. Run POST /api/v1/knowledge/ingest to populate the new store.`);
      setTimeout(() => setVsSwitchNotice(null), 6000);
    },
  });

  // LLM Config state
  const [provider, setProvider] = useState<'ollama' | 'gemini' | 'watsonx'>('ollama');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaEmbeddingModel, setOllamaEmbeddingModel] = useState('nomic-embed-text');
  const [ollamaChatModel, setOllamaChatModel] = useState('llama3.2');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiEmbeddingModel, setGeminiEmbeddingModel] = useState('models/gemini-embedding-001');
  const [geminiChatModel, setGeminiChatModel] = useState('gemini-2.5-flash');
  const [ollamaTestResult, setOllamaTestResult] = useState<{ status: string; message?: string; count?: number; availableModels?: string[] } | null>(null);

  const { data: me, error: meError } = useQuery({
    queryKey: ['me'],
    queryFn: () => request<{ sub: string; roles: string[] }>('/me'),
    retry: false
  });

  const { data: llmData, isLoading: llmLoading } = useQuery<LLMSettingsResponse>({
    queryKey: ['settings-llm'],
    queryFn: () => request<LLMSettingsResponse>('/settings/llm'),
  });

  useEffect(() => {
    if (llmData) {
      setProvider(llmData.llmProvider);
      if (llmData.ollama) {
        setOllamaBaseUrl(llmData.ollama.baseUrl || 'http://localhost:11434');
        setOllamaEmbeddingModel(llmData.ollama.embeddingModel || 'nomic-embed-text');
        setOllamaChatModel(llmData.ollama.chatModel || 'llama3.2');
      }
      if (llmData.gemini) {
        setGeminiEmbeddingModel(llmData.gemini.embeddingModel || 'models/gemini-embedding-001');
        setGeminiChatModel(llmData.gemini.chatModel || 'gemini-2.5-flash');
      }
    }
  }, [llmData]);

  const updateLLMMutation = useMutation({
    mutationFn: (newConfig: any) => request('/settings/llm', { method: 'POST', body: JSON.stringify(newConfig) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-llm'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    }
  });

  const testOllamaMutation = useMutation({
    mutationFn: (testUrl: string) => request<any>('/settings/llm/test-ollama', {
      method: 'POST',
      body: JSON.stringify({ baseUrl: testUrl })
    }),
    onSuccess: (data) => {
      setOllamaTestResult(data);
    },
    onError: (err: any) => {
      setOllamaTestResult({ status: 'OFFLINE', message: err.message || 'Connection failed' });
    }
  });

  const handleSaveLLM = (e: React.FormEvent) => {
    e.preventDefault();
    updateLLMMutation.mutate({
      llmProvider: provider,
      ollamaBaseUrl,
      ollamaEmbeddingModel,
      ollamaChatModel,
      geminiApiKey,
      embeddingModel: geminiEmbeddingModel,
      chatModel: geminiChatModel,
      watsonxUrl: '',
      watsonxApikey: '',
      watsonxProjectId: '',
      watsonxEmbeddingModel: 'ibm/slate-125m-english-rtrvr-v2',
      watsonxChatModel: 'ibm/granite-3-8b-instruct'
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            User & Localization Preferences
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Configure unit standards, display currencies, and role permissions.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-[#151A18] border border-[#8BCF45]/40 text-xs text-[#8BCF45] rounded-xs">
          Settings updated successfully.
        </div>
      )}
      {vsSwitchNotice && (
        <div className="p-3 bg-[#151A18] border border-[#6DA8C8]/40 text-xs text-[#6DA8C8] rounded-xs">
          {vsSwitchNotice}
        </div>
      )}

      <div className="space-y-6">
        {/* AI Model & LLM Provider Configuration */}
        <Card
          title="AI & Embedding Engine Configuration"
          subtitle="Configure on-premise local Ollama or cloud providers for RAG and semantic extraction."
          headerAction={
            <Badge status={llmData?.isConfigured ? 'LIVE' : 'ERROR'} />
          }
        >
          <form onSubmit={handleSaveLLM} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#9EAAA5] mb-1 font-medium">Select Active Provider:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('ollama')}
                  className={`p-3 text-left border rounded-xs transition-colors ${
                    provider === 'ollama'
                      ? 'border-[#8BCF45] bg-[#8BCF45]/10 text-[#E5ECE8]'
                      : 'border-[#26302C] bg-[#151A18] text-[#9EAAA5] hover:border-[#384640]'
                  }`}
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Ollama (Local / On-Prem)</span>
                    <span className="text-[10px] bg-[#8BCF45]/20 text-[#8BCF45] px-1.5 py-0.5 rounded">Recommended</span>
                  </div>
                  <p className="text-[11px] text-[#9EAAA5] mt-1">
                    Zero data egress, self-hosted, full offline privacy for enterprise & production.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('gemini')}
                  className={`p-3 text-left border rounded-xs transition-colors ${
                    provider === 'gemini'
                      ? 'border-[#8BCF45] bg-[#8BCF45]/10 text-[#E5ECE8]'
                      : 'border-[#26302C] bg-[#151A18] text-[#9EAAA5] hover:border-[#384640]'
                  }`}
                >
                  <div className="font-semibold text-white">Google Gemini</div>
                  <p className="text-[11px] text-[#9EAAA5] mt-1">
                    Cloud API key required (gemini-2.5-flash + gemini-embedding).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('watsonx')}
                  className={`p-3 text-left border rounded-xs transition-colors ${
                    provider === 'watsonx'
                      ? 'border-[#8BCF45] bg-[#8BCF45]/10 text-[#E5ECE8]'
                      : 'border-[#26302C] bg-[#151A18] text-[#9EAAA5] hover:border-[#384640]'
                  }`}
                >
                  <div className="font-semibold text-white">IBM watsonx.ai</div>
                  <p className="text-[11px] text-[#9EAAA5] mt-1">
                    Granite-3 & Slate models via IBM Cloud credentials.
                  </p>
                </button>
              </div>
            </div>

            {/* Ollama specific controls */}
            {provider === 'ollama' && (
              <div className="p-4 bg-[#111614] border border-[#26302C] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#8BCF45] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Ollama Service Connection
                  </span>
                  <button
                    type="button"
                    onClick={() => testOllamaMutation.mutate(ollamaBaseUrl)}
                    disabled={testOllamaMutation.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#181D1B] hover:bg-[#202724] border border-[#26302C] text-[#E5ECE8] rounded-xs text-[11px]"
                  >
                    <RefreshCw className={`w-3 h-3 ${testOllamaMutation.isPending ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </div>

                {ollamaTestResult && (
                  <div
                    className={`p-2.5 rounded-xs text-[11px] flex items-start gap-2 border ${
                      ollamaTestResult.status === 'ONLINE'
                        ? 'bg-[#8BCF45]/10 border-[#8BCF45]/30 text-[#8BCF45]'
                        : 'bg-[#D64545]/10 border-[#D64545]/30 text-[#E58080]'
                    }`}
                  >
                    {ollamaTestResult.status === 'ONLINE' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <strong>Ollama is {ollamaTestResult.status}</strong>: {ollamaTestResult.message || `Found ${ollamaTestResult.count} local models`}
                      {ollamaTestResult.availableModels && ollamaTestResult.availableModels.length > 0 && (
                        <div className="mt-1 text-[#9EAAA5] font-mono">
                          Installed: {ollamaTestResult.availableModels.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Ollama Base URL:</label>
                    <input
                      type="text"
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Chat Model:</label>
                    <input
                      type="text"
                      value={ollamaChatModel}
                      onChange={(e) => setOllamaChatModel(e.target.value)}
                      placeholder="llama3.2"
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Embedding Model:</label>
                    <input
                      type="text"
                      value={ollamaEmbeddingModel}
                      onChange={(e) => setOllamaEmbeddingModel(e.target.value)}
                      placeholder="nomic-embed-text"
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#68756F]">
                  Tip: Ensure models are downloaded locally with <code className="text-[#8BCF45]">ollama pull llama3.2</code> and <code className="text-[#8BCF45]">ollama pull nomic-embed-text</code>.
                </p>
              </div>
            )}

            {/* Gemini specific controls */}
            {provider === 'gemini' && (
              <div className="p-4 bg-[#111614] border border-[#26302C] rounded-xs space-y-3">
                <span className="font-semibold text-white">Google Gemini Configuration</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">API Key:</label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder={llmData?.gemini?.hasApiKey ? '(Key configured in server)' : 'AIzaSy...'}
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Chat Model:</label>
                    <input
                      type="text"
                      value={geminiChatModel}
                      onChange={(e) => setGeminiChatModel(e.target.value)}
                      placeholder="gemini-2.5-flash"
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Embedding Model:</label>
                    <input
                      type="text"
                      value={geminiEmbeddingModel}
                      onChange={(e) => setGeminiEmbeddingModel(e.target.value)}
                      placeholder="models/gemini-embedding-001"
                      className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* watsonx specific note */}
            {provider === 'watsonx' && (
              <div className="p-4 bg-[#111614] border border-[#26302C] rounded-xs text-[#9EAAA5] space-y-2">
                <span className="font-semibold text-white">IBM watsonx.ai Service</span>
                <p>
                  watsonx credentials and project IDs are loaded directly from the backend environment (<code className="text-[#8BCF45]">WATSONX_URL</code>, <code className="text-[#8BCF45]">WATSONX_APIKEY</code>, <code className="text-[#8BCF45]">WATSONX_PROJECT_ID</code>).
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateLLMMutation.isPending}
                className="px-4 py-2 bg-[#8BCF45] hover:bg-[#9BE050] text-[#0A0D0C] font-semibold rounded-xs transition-colors"
              >
                {updateLLMMutation.isPending ? 'Saving Configuration...' : 'Save AI Model Preferences'}
              </button>
            </div>
          </form>
        </Card>

        {/* Vector Store Backend */}
        <Card
          title="Vector Store Backend"
          subtitle="ChromaDB runs locally (no server needed). Switch to Db2 when you have a Db2 12.1.2+ instance."
          headerAction={<Badge status={vsData?.status === 'OK' ? 'LIVE' : 'STALE'} />}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['chroma', 'db2'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedVsBackend(b)}
                  className={`p-3 text-left border rounded-xs transition-colors ${
                    selectedVsBackend === b
                      ? 'border-[#8BCF45] bg-[#8BCF45]/10 text-[#E5ECE8]'
                      : 'border-[#26302C] bg-[#151A18] text-[#9EAAA5] hover:border-[#384640]'
                  }`}
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{b === 'chroma' ? 'ChromaDB (Local)' : 'Db2 12.1.2+'}</span>
                    {b === 'chroma' && <span className="text-[10px] bg-[#8BCF45]/20 text-[#8BCF45] px-1.5 py-0.5 rounded">Default</span>}
                    {b === 'db2' && vsData?.db2Configured && <span className="text-[10px] bg-[#6DA8C8]/20 text-[#6DA8C8] px-1.5 py-0.5 rounded">Configured</span>}
                  </div>
                  <p className="text-[11px] text-[#9EAAA5] mt-1">
                    {b === 'chroma' ? 'No server required. Persists to .chroma/ folder.' : 'Enterprise vector search. Needs DB2_HOST, DB2_USERNAME, DB2_PASSWORD.'}
                  </p>
                </button>
              ))}
            </div>
            {selectedVsBackend === 'db2' && !vsData?.db2Configured && (
              <div className="p-2.5 rounded-xs border border-yellow-500/40 bg-yellow-500/8 text-[11px] text-yellow-300">
                ⚠ Db2 credentials not configured. Set DB2_DATABASE, DB2_HOST, DB2_USERNAME, DB2_PASSWORD in your .env file first.
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-[#9EAAA5]">
              <span>
                <Database className="w-3.5 h-3.5 inline mr-1 text-[#8BCF45]" />
                {vsData ? `${vsData.chunksIndexed ?? 0} chunks indexed` : 'Loading…'}
                {vsData?.chromaPersistDir && <span className="font-mono text-[#68756F] ml-2">({vsData.chromaPersistDir})</span>}
              </span>
              <span className={`font-mono ${vsData?.status === 'OK' ? 'text-[#8BCF45]' : 'text-[#D6D75A]'}`}>{vsData?.status ?? '—'}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => vsRefetch()}
                className="px-3 py-1.5 bg-[#181D1B] border border-[#26302C] text-[#9EAAA5] rounded-xs text-[11px] hover:text-white"
              >
                Refresh Status
              </button>
              <button
                type="button"
                onClick={() => switchVsMutation.mutate(selectedVsBackend)}
                disabled={switchVsMutation.isPending || selectedVsBackend === vsData?.vectorStore}
                className="px-3 py-1.5 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] font-semibold rounded-xs text-[11px] disabled:opacity-50"
              >
                {switchVsMutation.isPending ? 'Switching…' : selectedVsBackend === vsData?.vectorStore ? 'Already Active' : `Switch to ${selectedVsBackend.toUpperCase()}`}
              </button>
            </div>
          </div>
        </Card>

        {/* Localization & Measurement System */}
        <Card title="Measurement & Currency Preferences" subtitle="Formats all mass, distance, and economic values at the API boundary.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#9EAAA5] mb-1 font-medium">Unit Measurement System:</label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as UnitSystem)}
                className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
              >
                <option value="METRIC">Metric Standard (kg, tonnes, km, MWh)</option>
                <option value="IMPERIAL">Imperial Standard (short tons, miles)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9EAAA5] mb-1 font-medium">Display Currency:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
              >
                <option value="USD">USD ($) - Global Benchmark</option>
                <option value="EUR">EUR (€) - European Union</option>
                <option value="INR">INR (₹) - India</option>
                <option value="BRL">BRL (R$) - Brazil</option>
                <option value="KES">KES (KSh) - Kenya</option>
                <option value="THB">THB (฿) - Thailand</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Access Role & Permissions */}
        <Card title="User Role & Authorization Scope" subtitle="Controls accessible simulation modes and oversight permissions.">
          <div className="text-xs space-y-3">
            <div>
              <label className="block text-[#9EAAA5] mb-1 font-medium">Active Workspace Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full sm:w-80 bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
              >
                <option value="enterprise">Enterprise / Bio-Industrial Buyer</option>
                <option value="farmer">Farmer / Agricultural Cooperative (FPO)</option>
                <option value="processor">Processing Facility Operator</option>
                <option value="researcher">Agronomic & Climate Researcher</option>
                <option value="government">Government & Policy Planner</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            <p className="text-[11px] text-[#68756F]">
              Note: Server authorization is authoritative via OIDC token validation. Selecting a client role tunes the interface viewports.
            </p>
          </div>
        </Card>

        {/* Accessibility & Motion */}
        <Card title="Accessibility Preferences" subtitle="WCAG AA contrast and motion accommodations.">
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="accent-[#8BCF45]"
              />
              <span className="text-[#E5ECE8]">Enable Reduced Motion (Disable map animations and graph transitions)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="accent-[#8BCF45]"
              />
              <span className="text-[#E5ECE8]">High Contrast Dividers & Focus Rings</span>
            </label>
          </div>
        </Card>

        {/* Region Boundary Layers Management */}
        <Card
          title="Administrative Boundary Layers"
          subtitle="Configure GeoJSON village boundaries, field mappings, and choropleth metrics."
          headerAction={
            <button
              onClick={() => navigate('/settings/layers')}
              className="text-xs font-semibold text-[#E0FF20] hover:underline"
            >
              Open Layer Admin &rarr;
            </button>
          }
        >
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-white block">Active Boundary Layers</span>
              <span className="text-[#9EAAA5]">Latur District Villages (1,009 Polygons) loaded as primary registry layer.</span>
            </div>
            <button
              onClick={() => navigate('/settings/layers')}
              className="px-3 py-1.5 bg-[#1E2129] hover:bg-[#252A36] border border-[#262B35] rounded-md text-white font-medium transition-colors"
            >
              Manage & Upload GeoJSON
            </button>
          </div>
        </Card>

        {/* Signed-in session (Application SDK: server-side session, no token in the browser) */}
        <Card title="Signed-in Session" subtitle="Identity comes from the platform sign-in. Roles below are authoritative.">
          <div className="space-y-1 text-xs font-mono text-[#E5ECE8]">
            {meError ? (
              <span className="text-[#D6D75A]">Not signed in or backend unreachable.</span>
            ) : me ? (
              <>
                <div>sub: {me.sub}</div>
                <div>roles: {me.roles.join(', ') || '(none)'}</div>
              </>
            ) : (
              <span className="text-[#68756F]">Loading…</span>
            )}
            <a href="/auth/logout" className="inline-block mt-2 px-3 py-1.5 bg-[#181D1B] border border-[#26302C] text-[#8BCF45] rounded-xs">
              Sign out
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

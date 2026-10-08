import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Layers,
  Share2,
  Workflow,
  Cpu,
  Factory,
  ArrowRightLeft,
  Truck,
  Leaf,
  Repeat,
  Bot,
  Database,
  Cable,
  FlaskConical,
  BookOpen,
  Activity,
  Settings,
  Sparkles,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { request } from '../../api/client.ts';

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    demo?: boolean;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Intelligence',
    items: [
      { label: 'Overview', path: '/', icon: LayoutGrid },
      { label: 'Sector & Global Map', path: '/map', icon: Compass },
      { label: 'Crops & Residue', path: '/resources', icon: Layers },
      { label: 'Resource Graph', path: '/graph', icon: Share2 }
    ]
  },
  {
    title: 'Pathways & Tech',
    items: [
      { label: 'Bio-Pathways', path: '/pathways', icon: Workflow },
      { label: 'Bio-Simulator', path: '/simulator', icon: Cpu, demo: true },
      { label: 'Processors', path: '/processors', icon: Factory },
      { label: 'Matching Engine', path: '/matching', icon: ArrowRightLeft, demo: true }
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Freight Logistics', path: '/logistics', icon: Truck, demo: true },
      { label: 'Climate Impact', path: '/impact', icon: Leaf },
      { label: 'Circular Loops', path: '/loops', icon: Repeat, demo: true }
    ]
  },
  {
    title: 'Platform',
    items: [
      { label: 'Region Layers', path: '/settings/layers', icon: MapPin },
      { label: 'AI Services', path: '/ai', icon: Bot },
      { label: 'Data Sources', path: '/data', icon: Database },
      { label: 'Integrations', path: '/integrations', icon: Cable },
      { label: 'Scenario Lab', path: '/scenarios', icon: FlaskConical, demo: true },
      { label: 'Research & AgroVOC', path: '/research', icon: BookOpen },
      { label: 'System Health', path: '/system', icon: Activity },
      { label: 'Circularity Demo', path: '/demo', icon: Sparkles, badge: '9-Step', demo: true },
      { label: 'Preferences', path: '/settings', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { data: healthData, isError } = useQuery<{ status: string; checks: Record<string, string> }>({
    queryKey: ['health', 'ready'],
    queryFn: () => request<{ status: string; checks: Record<string, string> }>('/health/ready'),
    refetchInterval: 30000
  });

  const rawChunks = healthData?.checks?.ragChunks;
  const chunkCount = rawChunks && rawChunks !== 'UNKNOWN' && rawChunks !== 'None' ? parseInt(rawChunks, 10) : 0;
  const status = isError ? 'ERROR' : healthData?.status === 'UP' ? 'UP' : healthData?.status === 'DEGRADED' ? 'DEGRADED' : 'UP';

  return (
    <aside className="w-56 bg-[#121317] border-r border-[#262B35] flex flex-col shrink-0 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="py-4 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#68756F]">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                        isActive
                          ? 'text-[#E0FF20] border-l-2 border-[#E0FF20] pl-2.5 font-semibold bg-transparent'
                          : 'text-[#9EAAA5] hover:text-white hover:bg-[#181A20]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon className="w-4 h-4 shrink-0 text-current" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.demo && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-bold">
                          DEMO
                        </span>
                      )}
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#E0FF20]/15 text-[#E0FF20] border border-[#E0FF20]/40 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CIRQ Status Indicator in Sidebar Bottom */}
      <div className="mt-auto p-3 border-t border-[#262B35] bg-[#121317] text-[11px] text-[#9EAAA5]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'ERROR'
                  ? 'bg-red-500'
                  : status === 'DEGRADED'
                  ? 'bg-yellow-400'
                  : 'bg-[#8BCF45] animate-pulse'
              }`}
            />
            <span className="text-white font-mono font-medium">CIRQ Telemetry</span>
          </span>
          <span
            className={`font-mono text-[10px] ${
              status === 'ERROR'
                ? 'text-red-400'
                : status === 'DEGRADED'
                ? 'text-yellow-400'
                : 'text-[#8BCF45]'
            }`}
          >
            {status === 'ERROR' ? 'OFFLINE' : status === 'DEGRADED' ? 'DEGRADED' : 'ONLINE'}
          </span>
        </div>
        <p className="text-[10px] text-[#68756F] mt-0.5 font-mono truncate">
          {chunkCount > 0 ? `${chunkCount} knowledge chunks` : 'Knowledge base empty — run ingest'}
        </p>
      </div>
    </aside>
  );
};

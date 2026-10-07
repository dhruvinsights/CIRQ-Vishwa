import React from 'react';
import { NavLink } from 'react-router-dom';
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

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
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
      { label: 'Bio-Simulator', path: '/simulator', icon: Cpu },
      { label: 'Processors', path: '/processors', icon: Factory },
      { label: 'Matching Engine', path: '/matching', icon: ArrowRightLeft }
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Freight Logistics', path: '/logistics', icon: Truck },
      { label: 'Climate Impact', path: '/impact', icon: Leaf },
      { label: 'Circular Loops', path: '/loops', icon: Repeat }
    ]
  },
  {
    title: 'Platform',
    items: [
      { label: 'Region Layers', path: '/settings/layers', icon: MapPin },
      { label: 'AI Services', path: '/ai', icon: Bot },
      { label: 'Data Sources', path: '/data', icon: Database },
      { label: 'Integrations', path: '/integrations', icon: Cable },
      { label: 'Scenario Lab', path: '/scenarios', icon: FlaskConical },
      { label: 'Research & AgroVOC', path: '/research', icon: BookOpen },
      { label: 'System Health', path: '/system', icon: Activity },
      { label: 'Circularity Demo', path: '/demo', icon: Sparkles, badge: '9-Step' },
      { label: 'Preferences', path: '/settings', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC = () => {
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
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#E0FF20]/15 text-[#E0FF20] border border-[#E0FF20]/40 font-bold">
                        {item.badge}
                      </span>
                    )}
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#E0FF20] animate-pulse" />
            <span className="text-white font-mono font-medium">CIRQ Telemetry</span>
          </span>
          <span className="font-mono text-[10px] text-[#E0FF20]">ONLINE</span>
        </div>
        <p className="text-[10px] text-[#68756F] mt-0.5 font-mono">1,009 Latur Region Nodes</p>
      </div>
    </aside>
  );
};

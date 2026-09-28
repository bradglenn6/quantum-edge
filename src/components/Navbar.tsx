import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Key, 
  FileText, 
  RefreshCw, 
  Cpu, 
  AlertTriangle, 
  Zap, 
  Wifi, 
  WifiOff, 
  Network,
  Bot
} from 'lucide-react';
import { BatteryProfile } from '../types';

export type NavTab = 
  | 'overview' 
  | 'pqc-lab' 
  | 'unigas' 
  | 'audit-compliance' 
  | 'offline-sync-dr' 
  | 'async-tasks' 
  | 'agent-sentinel' 
  | 'edge-stream'
  | 'automation';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  globalCircuitBreaker: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  onToggleCircuitBreaker: () => void;
  currentRegion: string;
  batteryProfile: BatteryProfile;
  onOpenTopology: () => void;
  gasBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  setIsOnline,
  globalCircuitBreaker,
  onToggleCircuitBreaker,
  currentRegion,
  batteryProfile,
  onOpenTopology,
  gasBalance
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Mission Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'pqc-lab', label: 'PQC Core', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'unigas', label: 'UniGas Ratchet', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'audit-compliance', label: 'Audit & Compliance', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'offline-sync-dr', label: 'Offline Sync & DR', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    { id: 'async-tasks', label: 'Async Scaler', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'agent-sentinel', label: 'Agent Sentinel', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'automation', label: 'Auto-Heal & Triggers', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'edge-stream', label: 'Edge Stream', icon: <Zap className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">ZEROLABZ</span>
              <span className="text-cyan-400 font-medium text-xs tracking-wider uppercase">QUANTUMEDGE</span>
            </div>
            {/* Zero-pill metadata */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono-code">
              <span>ML-KEM-1024</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>UniGas Ratchet v4.2</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Autonomous Mesh</span>
            </div>
          </div>
        </div>

        {/* Global Controls & Statuses */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Microservices Topology button */}
          <button
            onClick={onOpenTopology}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-colors"
            title="Inspect 8 Microservice Endpoints"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-mono-code">Microservices Mesh</span>
          </button>

          {/* UniGas Gas balance */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-slate-400">UniGas:</span>
            <span className="text-emerald-400 font-semibold">{gasBalance.toLocaleString()} μG</span>
          </div>

          {/* Region */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-slate-500">Region:</span>
            <span className="text-cyan-300">{currentRegion}</span>
          </div>

          {/* Battery Governor shortcut */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-mono-code">
            <span className="text-slate-500">Edge Gov:</span>
            <span className={batteryProfile === 'ULTRA_LOW_POWER' ? 'text-emerald-400' : batteryProfile === 'MISSION_CRITICAL_TURBO' ? 'text-amber-400' : 'text-cyan-400'}>
              {batteryProfile === 'ULTRA_LOW_POWER' ? 'Ultra-Low (4.2mW)' : batteryProfile === 'MISSION_CRITICAL_TURBO' ? 'Turbo (48mW)' : 'Mobile (18mW)'}
            </span>
          </div>

          {/* Offline/Online Network Switcher - Calm neutral colors when offline (NOT RED) */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors font-mono-code ${
              isOnline 
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/40' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
            title="Toggle Network Availability (Tests Offline-First CRDT & Disaster Sync)"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-purple-300" />}
            <span>{isOnline ? 'Online Mesh' : 'Airgap Offline'}</span>
          </button>

          {/* Guardrail Circuit Breaker - ONLY RED WHEN TRIPPED/ALARM */}
          <button
            onClick={onToggleCircuitBreaker}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors font-mono-code font-semibold ${
              globalCircuitBreaker === 'CLOSED'
                ? 'bg-cyan-950/30 border-cyan-700/60 text-cyan-300 hover:border-cyan-500'
                : 'bg-red-950/80 border-red-500 text-red-200 animate-pulse'
            }`}
            title="Master Circuit Breaker: Trips to isolate malfunctioning/rogue agents and seal cryptographic vaults"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${globalCircuitBreaker === 'CLOSED' ? 'text-cyan-400' : 'text-red-400'}`} />
            <span>BREAKER: {globalCircuitBreaker}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs - Smoothly scrollable with generous padding to prevent cutting off */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="flex items-center gap-1.5 min-w-max pr-8 sm:pr-12">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

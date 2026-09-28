import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PqcCryptoLab } from './components/PqcCryptoLab';
import { UniGasProtocolView } from './components/UniGasProtocolView';
import { AuditComplianceView } from './components/AuditComplianceView';
import { OfflineSyncDisasterView } from './components/OfflineSyncDisasterView';
import { AsyncTaskScalingView } from './components/AsyncTaskScalingView';
import { AgentSentinelView } from './components/AgentSentinelView';
import { AutomationControlView } from './components/AutomationControlView';
import { EdgeStreamBatteryView } from './components/EdgeStreamBatteryView';
import { MicroservicesTopologyModal } from './components/MicroservicesTopologyModal';

import { UniGasService } from './services/unigasService';
import { AgentSentinelService } from './services/agentSentinelService';
import { SyncDisasterService } from './services/syncDisasterService';
import { EdgeStreamService } from './services/edgeStreamService';
import { BatteryProfile, DisasterRecoveryState, EdgeStreamMetric, UniGasSession } from './types';

export default function App() {
  const unigasService = UniGasService.getInstance();
  const sentinelService = AgentSentinelService.getInstance();
  const syncService = SyncDisasterService.getInstance();
  const edgeService = EdgeStreamService.getInstance();

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Core state
  const [session, setSession] = useState<UniGasSession | null>(unigasService.getSession());
  const [isOnline, setIsOnline] = useState<boolean>(syncService.getIsOnline());
  const [globalCircuitBreaker, setGlobalCircuitBreaker] = useState<'CLOSED' | 'HALF_OPEN' | 'OPEN'>(
    sentinelService.getGlobalCircuitBreaker()
  );
  const [recoveryState, setRecoveryState] = useState<DisasterRecoveryState>(syncService.getRecoveryState());
  const [batteryProfile, setBatteryProfile] = useState<BatteryProfile>(edgeService.getProfile());
  const [agents, setAgents] = useState(sentinelService.getAgents());
  const [latestMetric, setLatestMetric] = useState<EdgeStreamMetric | null>(null);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);

  // Subscriptions
  useEffect(() => {
    const unsubAgents = sentinelService.subscribe(updated => {
      setAgents(updated);
      setGlobalCircuitBreaker(sentinelService.getGlobalCircuitBreaker());
    });

    const unsubEdge = edgeService.subscribe(metric => {
      setLatestMetric(metric);
    });

    return () => {
      unsubAgents();
      unsubEdge();
    };
  }, [sentinelService, edgeService]);

  const handleToggleCircuitBreaker = () => {
    const next = globalCircuitBreaker === 'CLOSED' ? 'OPEN' : 'CLOSED';
    sentinelService.setGlobalCircuitBreaker(next);
    setGlobalCircuitBreaker(next);
  };

  const handleQuickSimulateRogue = () => {
    // Find first healthy or anomalous agent and corrupt it
    const target = agents.find(a => a.status === 'HEALTHY' || a.status === 'ANOMALOUS') || agents[0];
    if (target) {
      sentinelService.simulateCorruption(target.id);
      setActiveTab('agent-sentinel');
    }
  };

  return (
    <div className="min-h-screen bg-[#06090f] text-slate-200 flex flex-col bg-cyber-grid">
      {/* Top Mission Control Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        setIsOnline={val => {
          setIsOnline(val);
          syncService.setOnlineStatus(val);
          setRecoveryState(syncService.getRecoveryState());
        }}
        globalCircuitBreaker={globalCircuitBreaker}
        onToggleCircuitBreaker={handleToggleCircuitBreaker}
        currentRegion={recoveryState.currentRegion}
        batteryProfile={batteryProfile}
        onOpenTopology={() => setIsTopologyOpen(true)}
        gasBalance={session?.gasBalanceMicroGas || 100000}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard
            setActiveTab={setActiveTab}
            session={session}
            agents={agents}
            recoveryState={recoveryState}
            latestMetric={latestMetric}
            batteryProfile={batteryProfile}
            isOnline={isOnline}
            globalCircuitBreaker={globalCircuitBreaker}
            onQuickSimulateRogue={handleQuickSimulateRogue}
          />
        )}

        {activeTab === 'pqc-lab' && <PqcCryptoLab />}

        {activeTab === 'unigas' && (
          <UniGasProtocolView
            session={session}
            onSessionUpdated={updated => setSession(updated)}
          />
        )}

        {activeTab === 'audit-compliance' && <AuditComplianceView />}

        {activeTab === 'offline-sync-dr' && (
          <OfflineSyncDisasterView
            isOnline={isOnline}
            setIsOnline={val => {
              setIsOnline(val);
              syncService.setOnlineStatus(val);
              setRecoveryState(syncService.getRecoveryState());
            }}
            recoveryState={recoveryState}
            onStateUpdated={st => setRecoveryState(st)}
          />
        )}

        {activeTab === 'async-tasks' && <AsyncTaskScalingView />}

        {activeTab === 'agent-sentinel' && (
          <AgentSentinelView
            agents={agents}
            globalCircuitBreaker={globalCircuitBreaker}
            onCircuitBreakerToggle={handleToggleCircuitBreaker}
          />
        )}

       {activeTab === 'automation' && <AutomationControlView />}

        {activeTab === 'edge-stream' && (
          <EdgeStreamBatteryView
            currentProfile={batteryProfile}
            onProfileChange={prof => setBatteryProfile(prof)}
            latestMetric={latestMetric}
          />
        )}
      </main>

      {/* Microservices Topology Modal */}
      <MicroservicesTopologyModal
        isOpen={isTopologyOpen}
        onClose={() => setIsTopologyOpen(false)}
      />

      {/* Tactical Mission Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-3 text-xs text-slate-500 font-mono-code">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-semibold">ZeroLabz QuantumEdge Core</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>NIST FIPS 203 (ML-KEM) / 204 (ML-DSA)</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>UniGas Key Exchange</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Airgap Redundancy:</span>
            <span className="text-emerald-400">ACTIVE</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Circuit Breaker:</span>
            <span className={globalCircuitBreaker === 'CLOSED' ? 'text-cyan-400 font-semibold' : 'text-red-400 font-bold'}>
              {globalCircuitBreaker}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

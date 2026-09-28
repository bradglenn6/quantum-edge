import React from 'react';
import { 
  ShieldCheck, 
  Key, 
  FileCheck, 
  RefreshCw, 
  Cpu, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { NavTab } from './Navbar';
import { AiAgent, BatteryProfile, DisasterRecoveryState, EdgeStreamMetric, UniGasSession } from '../types';

interface OverviewDashboardProps {
  setActiveTab: (tab: NavTab) => void;
  session: UniGasSession | null;
  agents: AiAgent[];
  recoveryState: DisasterRecoveryState;
  latestMetric: EdgeStreamMetric | null;
  batteryProfile: BatteryProfile;
  isOnline: boolean;
  globalCircuitBreaker: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  onQuickSimulateRogue: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  setActiveTab,
  session,
  agents,
  recoveryState,
  latestMetric,
  batteryProfile,
  isOnline,
  globalCircuitBreaker,
  onQuickSimulateRogue
}) => {
  const healthyAgents = agents.filter(a => a.status === 'HEALTHY').length;
  const rogueAgents = agents.filter(a => a.status === 'CORRUPTED_ROGUE' || a.status === 'QUARANTINED_ISOLATED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Circuit Breaker Tripped */}
      {globalCircuitBreaker !== 'CLOSED' && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-500/60 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm">CIRCUIT BREAKER GUARDRAIL TRIPPED [{globalCircuitBreaker}]</div>
              <div className="text-xs text-red-300">
                Automated rogue agent isolation activated. Outbound cryptographic keys suspended. Zero-trust quarantine active.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('agent-sentinel')}
            className="px-3 py-1.5 rounded bg-red-800 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap self-start sm:self-auto"
          >
            Open Sentinel Recovery
          </button>
        </div>
      )}

      {/* Hero Mission Control Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: PQC Security Standard */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono-code">PQC Shield Level</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mb-1">NIST FIPS 203/204</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
            <span className="text-cyan-400">ML-KEM-1024</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>ML-DSA-87</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">&lt;1.8ms</span>
          </div>
        </div>

        {/* Metric 2: UniGas Ratchet Session */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono-code">UniGas Ratchet</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            Epoch #{session?.ratchetEpoch || 42}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
            <span className="text-emerald-400">{session?.gasBalanceMicroGas.toLocaleString()} μG</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>18 μG/tx</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">Active E2EE</span>
          </div>
        </div>

        {/* Metric 3: AI Agent Fleet & Guardrail */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono-code">Agent Mesh Fleet</span>
            <AlertTriangle className={`w-4 h-4 ${rogueAgents > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {healthyAgents}/{agents.length} Healthy
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
            <span className={rogueAgents > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400'}>
              {rogueAgents} Quarantined
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Breaker: {globalCircuitBreaker}</span>
          </div>
        </div>

        {/* Metric 4: Edge Stream & Battery */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono-code">Edge Telemetry</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {latestMetric ? `${latestMetric.packetsProcessedPerSec} pkt/s` : '1,840 pkt/s'}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
            <span className="text-cyan-300">{latestMetric?.edgeLatencyMicroSec || 410} μs</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">{latestMetric?.batteryDrawMilliWatts || 18.5} mW</span>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Architecture Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Post-Quantum Security &amp; Autonomous Mesh Architecture</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time operational status across the 7 mission-critical functional modules
                </p>
              </div>
              <span className="text-xs font-mono-code text-cyan-400">ZeroLabz v3.8.4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Module 1 */}
              <div 
                onClick={() => setActiveTab('pqc-lab')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">ZeroLabz PQC Engine</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Module-Lattice ML-KEM-1024 &amp; ML-DSA-87 digital signatures with mobile ARM NEON / AVX SIMD vector acceleration.
                </p>
                <div className="mt-2 text-[11px] text-cyan-400/90 font-mono-code">Sub-2ms roundtrip · Quantum immune</div>
              </div>

              {/* Module 2 */}
              <div 
                onClick={() => setActiveTab('unigas')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">UniGas Key Exchange</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gas-metered epoch keys preventing replay and state probing. Seamless integration with existing OAuth / JWT auth flows.
                </p>
                <div className="mt-2 text-[11px] text-emerald-400/90 font-mono-code">Ratchet Epoch #42 · 18 μG gas meter</div>
              </div>

              {/* Module 3 */}
              <div 
                onClick={() => setActiveTab('audit-compliance')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">Encrypted Audit &amp; Compliance</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tamper-evident SHA-384 &amp; ML-DSA block-chained audit ledger. Automated reporting for NIST SP 800-208, FIPS, SOC 2, &amp; FedRAMP.
                </p>
                <div className="mt-2 text-[11px] text-indigo-400/90 font-mono-code">100% Chain Integrity · Auto Attestations</div>
              </div>

              {/* Module 4 */}
              <div 
                onClick={() => setActiveTab('offline-sync-dr')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-teal-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">Offline-First Sync &amp; Disaster Recovery</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conflict-Free Replicated Data Types (CRDTs) with Vector Clocks. Multi-cloud failover (AWS/GCP/Azure) and Point-In-Time-Recovery (PITR).
                </p>
                <div className="mt-2 text-[11px] text-teal-400/90 font-mono-code">RTO: 3.4s · Zero Data Loss Guarantee</div>
              </div>

              {/* Module 5 */}
              <div 
                onClick={() => setActiveTab('async-tasks')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">Async Distributed Task Engine</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Horizontally scaled priority queues across multi-cloud providers with worker pool backpressure and dead-letter queues.
                </p>
                <div className="mt-2 text-[11px] text-purple-400/90 font-mono-code">4 Worker Pools · Dynamic Load Balancing</div>
              </div>

              {/* Module 6 */}
              <div 
                onClick={() => setActiveTab('agent-sentinel')}
                className="p-3.5 rounded border border-slate-800 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">AI Agent Sentinel &amp; Breaker</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Surveillance of autonomous agents for entropy drift, rogue prompt deviations, with instant circuit breaker isolation and 4-stage recovery.
                </p>
                <div className="mt-2 text-[11px] text-amber-400/90 font-mono-code">Zero-Trust Sandbox · Auto Key Revocation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Quick Actions & Live Stream Health */}
        <div className="space-y-4">
          {/* Quick Simulation Panel */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono-code">
              Mission Control Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('pqc-lab')}
                className="w-full flex items-center justify-between px-3 py-2 rounded bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Launch PQC Encryption Workbench</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono-code">TEST</span>
              </button>

              <button
                onClick={() => setActiveTab('unigas')}
                className="w-full flex items-center justify-between px-3 py-2 rounded bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Execute UniGas Handshake</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono-code">EXEC</span>
              </button>

              <button
                onClick={onQuickSimulateRogue}
                className="w-full flex items-center justify-between px-3 py-2 rounded bg-amber-950/30 hover:bg-amber-900/30 text-xs text-amber-200 border border-amber-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate Corrupted Agent Anomaly</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono-code">INJECT</span>
              </button>

              <button
                onClick={() => setActiveTab('audit-compliance')}
                className="w-full flex items-center justify-between px-3 py-2 rounded bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Generate FIPS-203 Compliance Report</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono-code">GEN</span>
              </button>
            </div>
          </div>

          {/* Disaster Recovery Status Card */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono-code">
                Disaster Recovery &amp; Failover
              </span>
              <span className={`text-[11px] font-mono-code ${isOnline ? 'text-emerald-400' : 'text-purple-300'}`}>
                {isOnline ? 'ONLINE ACTIVE' : 'AIRGAP ISOLATED'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono-code">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Active Primary:</span>
                <span className="text-white font-medium">{recoveryState.currentRegion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">RPO (Loss Window):</span>
                <span className="text-emerald-400 font-medium">{recoveryState.rpoSeconds}s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">RTO (Failover):</span>
                <span className="text-cyan-400 font-medium">{recoveryState.rtoSeconds}s</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Vault Integrity:</span>
                <span className="text-emerald-400 font-semibold">{recoveryState.backupVaultIntegrity}% Verified</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('offline-sync-dr')}
              className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Manage Multi-Cloud Disaster Failover
            </button>
          </div>

          {/* Edge Battery Profile Quick Status */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono-code">
                Edge Battery Governor
              </span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            <div className="text-xs text-slate-300">
              Current Profile:{' '}
              <span className="font-semibold text-cyan-400">
                {batteryProfile === 'ULTRA_LOW_POWER' ? 'Ultra-Low Power IoT (4.2mW)' : batteryProfile === 'MISSION_CRITICAL_TURBO' ? 'Mission-Critical Turbo (48mW)' : 'Balanced Mobile (18.5mW)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Optimized for mobile &amp; IoT devices at network edge with SIMD quantized lattice math.
            </p>

            <button
              onClick={() => setActiveTab('edge-stream')}
              className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Tune Battery Governor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

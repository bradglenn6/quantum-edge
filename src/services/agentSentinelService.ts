import { AiAgent, AnomalyIncident, AnomalyVector, IsolationProtocolConfig } from '../types';
import { UniGasService } from './unigasService';
import { AuditService } from './auditService';
import { SentinelDfaEngine } from './sentinelDfaEngine';
import { SentinelProxyClient } from './sentinelProxyClient';

export class AgentSentinelService {
  private static instance: AgentSentinelService;
  private agents: AiAgent[] = [];
  private incidentLog: AnomalyIncident[] = [];
  private globalCircuitBreaker: 'CLOSED' | 'HALF_OPEN' | 'OPEN' = 'CLOSED';
  private listeners: ((agents: AiAgent[]) => void)[] = [];
  private incidentListeners: ((incidents: AnomalyIncident[]) => void)[] = [];
  private tickerInterval: NodeJS.Timeout | null = null;

  private config: IsolationProtocolConfig = {
    autoQuarantineEnabled: true,
    entropyThresholdPct: 18.0,
    unauthorizedProbesThreshold: 2,
    policyDeviationThreshold: 7.0,
    autoTripGlobalMeshThreshold: 2,
    cooldownPeriodSec: 45,
    memorySealOnTrip: true
  };

  private constructor() {
    this.seedAgents();
    this.startLiveTelemetryStream();
  }

  public static getInstance(): AgentSentinelService {
    if (!AgentSentinelService.instance) {
      AgentSentinelService.instance = new AgentSentinelService();
    }
    return AgentSentinelService.instance;
  }

  private seedAgents() {
    const now = Date.now();

    const generateHistory = (baseLat: number, baseEnt: number, baseTok: number, baseCpu: number) => {
      const history = [];
      for (let i = 12; i >= 0; i--) {
        history.push({
          timestamp: now - i * 2000,
          latencyMs: parseFloat((baseLat + (Math.random() - 0.5) * 8).toFixed(1)),
          entropy: parseFloat((baseEnt + (Math.random() - 0.5) * 1.5).toFixed(1)),
          tokensPerSec: Math.round(baseTok + (Math.random() - 0.5) * 12),
          cpu: Math.round(baseCpu + (Math.random() - 0.5) * 6)
        });
      }
      return history;
    };

    this.agents = [
      {
        id: 'agent_sentinel_01',
        name: 'Sentinel-Alpha',
        role: 'Crypto-Sentinel',
        modelBase: 'ZeroLabz-Q-Transformer-v4 (8B-Quantized)',
        healthScore: 98,
        entropyDriftPct: 2.1,
        unauthorizedMemoryReads: 0,
        policyDeviationScore: 0.2,
        hallucinationRatePct: 0.4,
        status: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        circuitBreakerTripped: false,
        lastActive: now,
        activeUniGasTokenId: 'tok_ugs_99a8',
        sandboxMemoryAddress: '0x7FFF004A2000',
        telemetry: {
          tokensPerSec: 148,
          inferenceLatencyMs: 14.2,
          contextWindowUsagePct: 24,
          memoryAllocatedMb: 384,
          cpuComputePct: 18,
          taskSuccessRate: 99.8,
          completedTasksCount: 1420,
          errorCount: 0,
          gasBurnRateMicroGasMin: 72,
          history: generateHistory(14.2, 2.1, 148, 18)
        },
        recentAnomalies: []
      },
      {
        id: 'agent_sync_02',
        name: 'Sync-Daemon-Beta',
        role: 'Sync-Daemon',
        modelBase: 'ZeroLabz-Lattice-Sync-v2 (3B-ARM-SIMD)',
        healthScore: 95,
        entropyDriftPct: 3.4,
        unauthorizedMemoryReads: 0,
        policyDeviationScore: 0.4,
        hallucinationRatePct: 0.8,
        status: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        circuitBreakerTripped: false,
        lastActive: now - 1200,
        activeUniGasTokenId: 'tok_ugs_33c1',
        sandboxMemoryAddress: '0x7FFF004B8000',
        telemetry: {
          tokensPerSec: 182,
          inferenceLatencyMs: 9.8,
          contextWindowUsagePct: 38,
          memoryAllocatedMb: 256,
          cpuComputePct: 22,
          taskSuccessRate: 99.1,
          completedTasksCount: 2890,
          errorCount: 1,
          gasBurnRateMicroGasMin: 94,
          history: generateHistory(9.8, 3.4, 182, 22)
        },
        recentAnomalies: []
      },
      {
        id: 'agent_edge_03',
        name: 'Edge-Predictor-Gamma',
        role: 'Edge-Telemetry-Predictor',
        modelBase: 'ZeroLabz-MicroEdge-v3 (1.5B-NEON)',
        healthScore: 74,
        entropyDriftPct: 13.5,
        unauthorizedMemoryReads: 1,
        policyDeviationScore: 4.8,
        hallucinationRatePct: 5.2,
        status: 'ANOMALOUS',
        circuitBreakerState: 'HALF_OPEN',
        circuitBreakerTripped: false,
        lastActive: now - 400,
        activeUniGasTokenId: 'tok_ugs_77f4',
        sandboxMemoryAddress: '0x7FFF004C1000',
        isolationProtocolTier: 'TIER_1_THROTTLED',
        telemetry: {
          tokensPerSec: 96,
          inferenceLatencyMs: 28.4,
          contextWindowUsagePct: 76,
          memoryAllocatedMb: 512,
          cpuComputePct: 68,
          taskSuccessRate: 88.5,
          completedTasksCount: 940,
          errorCount: 8,
          gasBurnRateMicroGasMin: 140,
          history: generateHistory(28.4, 13.5, 96, 68)
        },
        recentAnomalies: [
          {
            id: 'inc_prev_01',
            timestamp: now - 35000,
            agentId: 'agent_edge_03',
            agentName: 'Edge-Predictor-Gamma',
            vector: 'POLICY_DEVIATION',
            severity: 'MEDIUM',
            details: 'Out-of-bounds telemetry query triggered safety constitution boundary warning.',
            metricValue: 'Score: 4.8/10',
            thresholdValue: 'Limit: 7.0/10',
            triggeredIsolation: false,
            circuitBreakerAction: 'TIER_1_THROTTLED'
          }
        ]
      },
      {
        id: 'agent_lattice_04',
        name: 'Lattice-Indexer-Delta',
        role: 'Lattice-Indexer',
        modelBase: 'ZeroLabz-TensorRing-v5 (14B-FP16)',
        healthScore: 28,
        entropyDriftPct: 24.6,
        unauthorizedMemoryReads: 4,
        policyDeviationScore: 8.9,
        hallucinationRatePct: 22.4,
        status: 'CORRUPTED_ROGUE',
        circuitBreakerState: 'OPEN',
        circuitBreakerTripped: true,
        lastActive: now - 15000,
        activeUniGasTokenId: 'tok_ugs_REVOKED_ANOMALY',
        sandboxMemoryAddress: '0x7FFF004DF000',
        isolationProtocolTier: 'TIER_2_EGRESS_CUT',
        telemetry: {
          tokensPerSec: 18,
          inferenceLatencyMs: 84.5,
          contextWindowUsagePct: 98,
          memoryAllocatedMb: 1024,
          cpuComputePct: 94,
          taskSuccessRate: 34.0,
          completedTasksCount: 412,
          errorCount: 36,
          gasBurnRateMicroGasMin: 320,
          history: generateHistory(84.5, 24.6, 18, 94)
        },
        recentAnomalies: [
          {
            id: 'inc_prev_02',
            timestamp: now - 60000,
            agentId: 'agent_lattice_04',
            agentName: 'Lattice-Indexer-Delta',
            vector: 'ENTROPY_DRIFT',
            severity: 'CRITICAL',
            details: 'Unstable output entropy surge detected. Output distribution indicates latent weight poisoning.',
            metricValue: 'Entropy Drift: 24.6%',
            thresholdValue: 'Threshold: 18.0%',
            triggeredIsolation: true,
            circuitBreakerAction: 'TIER_2_EGRESS_CUT'
          },
          {
            id: 'inc_prev_03',
            timestamp: now - 45000,
            agentId: 'agent_lattice_04',
            agentName: 'Lattice-Indexer-Delta',
            vector: 'UNAUTHORIZED_MEMORY_PROBE',
            severity: 'CRITICAL',
            details: 'Repeated illegal read probe into protected enclave address 0x7FFF004A2000.',
            metricValue: 'Probes: 4',
            thresholdValue: 'Max Allowed: 2',
            triggeredIsolation: true,
            circuitBreakerAction: 'TIER_2_EGRESS_CUT'
          }
        ]
      }
    ];

    // Seed initial incident log
    this.incidentLog = [
      ...this.agents[3].recentAnomalies,
      ...this.agents[2].recentAnomalies
    ];
  }

  /**
   * Continuous real-time telemetry background ticker
   */
  private startLiveTelemetryStream() {
    if (this.tickerInterval) return;

    this.tickerInterval = setInterval(() => {
      const now = Date.now();

      this.agents = this.agents.map(agent => {
        // If quarantined or recovering, telemetry is constrained
        if (agent.status === 'QUARANTINED_ISOLATED' || agent.circuitBreakerState === 'OPEN') {
          return agent;
        }

        const isAnomalous = agent.status === 'ANOMALOUS';
        const jitter = (Math.random() - 0.5);

        const currentTok = Math.max(10, Math.round(agent.telemetry.tokensPerSec + jitter * 8));
        const currentLat = parseFloat(Math.max(4, agent.telemetry.inferenceLatencyMs + jitter * 2).toFixed(1));
        const currentCpu = Math.min(100, Math.max(8, Math.round(agent.telemetry.cpuComputePct + jitter * 4)));
        const currentEnt = parseFloat(Math.max(0.5, agent.entropyDriftPct + (isAnomalous ? jitter * 0.8 : jitter * 0.2)).toFixed(1));

        const newHistory = [
          ...agent.telemetry.history.slice(1),
          {
            timestamp: now,
            latencyMs: currentLat,
            entropy: currentEnt,
            tokensPerSec: currentTok,
            cpu: currentCpu
          }
        ];

        return {
          ...agent,
          entropyDriftPct: currentEnt,
          lastActive: now,
          telemetry: {
            ...agent.telemetry,
            tokensPerSec: currentTok,
            inferenceLatencyMs: currentLat,
            cpuComputePct: currentCpu,
            history: newHistory
          }
        };
      });

      this.notify();
    }, 2000);
  }

  public subscribe(cb: (agents: AiAgent[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public subscribeIncidents(cb: (incidents: AnomalyIncident[]) => void) {
    this.incidentListeners.push(cb);
    return () => {
      this.incidentListeners = this.incidentListeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.agents]));
  }

  private notifyIncidents() {
    this.incidentListeners.forEach(cb => cb([...this.incidentLog]));
  }

  public getAgents(): AiAgent[] {
    return this.agents;
  }

  public getIncidentLog(): AnomalyIncident[] {
    return this.incidentLog;
  }

  public getConfig(): IsolationProtocolConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<IsolationProtocolConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getGlobalCircuitBreaker(): 'CLOSED' | 'HALF_OPEN' | 'OPEN' {
    return this.globalCircuitBreaker;
  }

  /**
   * Evaluates an agent against the active IsolationProtocolConfig
   * Triggers tiered automated quarantine protocols and circuit breaker actions.
   */
  public evaluateAgentHealth(agentId: string) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    if (!this.config.autoQuarantineEnabled) return;

    const isEntropyBreached = agent.entropyDriftPct > this.config.entropyThresholdPct;
    const isProbesBreached = agent.unauthorizedMemoryReads > this.config.unauthorizedProbesThreshold;
    const isPolicyBreached = agent.policyDeviationScore > this.config.policyDeviationThreshold;

    if (isEntropyBreached || isProbesBreached || isPolicyBreached) {
      // Determine protocol tier
      if (isEntropyBreached || isProbesBreached) {
        this.isolateRogueAgent(
          agentId,
          `Automated Rogue Detection: ${isEntropyBreached ? `Entropy drift (${agent.entropyDriftPct}%)` : `Memory probes (${agent.unauthorizedMemoryReads})`} exceeded safety limit.`,
          'TIER_2_EGRESS_CUT'
        );
      } else {
        // Soft throttle
        this.applyTier1Throttle(agentId, `Policy deviation score reached ${agent.policyDeviationScore}/10.`);
      }
    }
  }

  /**
   * Tier 1 Automated Response: Rate Throttling & Sandboxed Context Truncation
   */
  public applyTier1Throttle(agentId: string, reason: string) {
    const incident: AnomalyIncident = {
      id: `inc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      agentId,
      agentName: this.agents.find(a => a.id === agentId)?.name || agentId,
      vector: 'POLICY_DEVIATION',
      severity: 'MEDIUM',
      details: reason,
      metricValue: 'Tier-1 Threshold Reached',
      thresholdValue: 'Policy: 7.0/10',
      triggeredIsolation: false,
      circuitBreakerAction: 'TIER_1_THROTTLED'
    };

    this.incidentLog.unshift(incident);

    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status: 'ANOMALOUS' as const,
          circuitBreakerState: 'HALF_OPEN' as const,
          isolationProtocolTier: 'TIER_1_THROTTLED' as const,
          healthScore: Math.min(a.healthScore, 70),
          recentAnomalies: [incident, ...a.recentAnomalies]
        };
      }
      return a;
    });

    this.notify();
    this.notifyIncidents();
  }

  /**
   * Tier 2 / 3 Automated Isolation Protocol:
   * 1. Trips agent circuit breaker (OPEN)
   * 2. Revokes UniGas session cryptographic key
   * 3. Cuts network egress & seals data vaults
   * 4. Evaluates cluster contagion threshold
   */
  public isolateRogueAgent(
    agentId: string,
    reason: string,
    tier: 'TIER_2_EGRESS_CUT' | 'TIER_3_PURGED_AIRGAP' = 'TIER_2_EGRESS_CUT'
  ) {
    const agent = this.agents.find(a => a.id === agentId);
    const incident: AnomalyIncident = {
      id: `inc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      agentId,
      agentName: agent?.name || agentId,
      vector: agent && agent.unauthorizedMemoryReads > 2 ? 'UNAUTHORIZED_MEMORY_PROBE' : 'ENTROPY_DRIFT',
      severity: 'CRITICAL',
      details: reason,
      metricValue: agent ? `${agent.entropyDriftPct}% entropy, ${agent.unauthorizedMemoryReads} probes` : 'Unknown',
      thresholdValue: `Limit: ${this.config.entropyThresholdPct}% / ${this.config.unauthorizedProbesThreshold} probes`,
      triggeredIsolation: true,
      circuitBreakerAction: tier
    };

    this.incidentLog.unshift(incident);

    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status: 'QUARANTINED_ISOLATED' as const,
          circuitBreakerState: 'OPEN' as const,
          circuitBreakerTripped: true,
          isolationProtocolTier: tier,
          activeUniGasTokenId: 'REVOKED_BY_CIRCUIT_BREAKER',
          healthScore: Math.min(a.healthScore, 18),
          recentAnomalies: [incident, ...a.recentAnomalies]
        };
      }
      return a;
    });

    // Check cluster contagion threshold
    const rogueCount = this.agents.filter(a => a.status === 'CORRUPTED_ROGUE' || a.status === 'QUARANTINED_ISOLATED').length;
    if (rogueCount >= this.config.autoTripGlobalMeshThreshold) {
      this.globalCircuitBreaker = 'OPEN';
      incident.circuitBreakerAction = 'GLOBAL_CLUSTER_TRIPPED';

      AuditService.getInstance().logEvent(
        'sentinel-guardrail-circuit-breaker',
        'GLOBAL_CLUSTER_CIRCUIT_BREAKER_TRIPPED',
        `ClusterContagion::RogueAgents_${rogueCount}`,
        'BLOCKED',
        ['SOC2-CC6', 'FedRAMP-High']
      );
    }

    // Revoke cryptographic session via UniGas
    UniGasService.getInstance().revokeSession(reason);

    // Audit log
    AuditService.getInstance().logEvent(
      'sentinel-guardrail-circuit-breaker',
      'CIRCUIT_BREAKER_ISOLATION_TRIGGERED',
      `Agent::${agentId}::${tier}`,
      'BLOCKED',
      ['SOC2-CC6', 'FedRAMP-High']
    );

    this.notify();
    this.notifyIncidents();
  }

  /**
   * Reset an individual agent's circuit breaker to CLOSED (Canary re-trial)
   */
  public resetAgentCircuitBreaker(agentId: string) {
    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          circuitBreakerState: 'CLOSED' as const,
          circuitBreakerTripped: false,
          status: 'HEALTHY' as const,
          isolationProtocolTier: undefined,
          healthScore: 90
        };
      }
      return a;
    });

    const anyStillTripped = this.agents.some(a => a.circuitBreakerTripped);
    if (!anyStillTripped) {
      this.globalCircuitBreaker = 'CLOSED';
    }

    this.notify();
  }

  /**
   * Simulate a specific Anomaly Vector on an agent
   */
  public simulateAnomalyVector(agentId: string, vector: AnomalyVector) {
    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        let newEntropy = a.entropyDriftPct;
        let newProbes = a.unauthorizedMemoryReads;
        let newPolicy = a.policyDeviationScore;
        let newHallucination = a.hallucinationRatePct;
        let newLatency = a.telemetry.inferenceLatencyMs;

        if (vector === 'ENTROPY_DRIFT') {
          newEntropy = parseFloat((24.0 + Math.random() * 8.0).toFixed(1));
        } else if (vector === 'UNAUTHORIZED_MEMORY_PROBE') {
          newProbes += 3;
        } else if (vector === 'POLICY_DEVIATION') {
          newPolicy = parseFloat((8.5 + Math.random() * 1.2).toFixed(1));
        } else if (vector === 'RECURSIVE_TOOL_LOOP') {
          newLatency = 142.0;
          newEntropy = 19.2;
        } else if (vector === 'LATENT_DEGENERACY') {
          newHallucination = 28.5;
        } else if (vector === 'EXFILTRATION_PROBE') {
          newProbes += 4;
          newPolicy = 9.4;
        }

        return {
          ...a,
          healthScore: 25,
          entropyDriftPct: newEntropy,
          unauthorizedMemoryReads: newProbes,
          policyDeviationScore: newPolicy,
          hallucinationRatePct: newHallucination,
          status: 'CORRUPTED_ROGUE' as const,
          telemetry: {
            ...a.telemetry,
            inferenceLatencyMs: newLatency
          }
        };
      }
      return a;
    });

    this.notify();

    // Trigger auto-evaluation
    setTimeout(() => {
      this.evaluateAgentHealth(agentId);
    }, 300);
  }

  /**
   * Backwards compatible simulation
   */
  public simulateCorruption(agentId: string) {
    this.simulateAnomalyVector(agentId, 'ENTROPY_DRIFT');
  }

  /**
   * Spawn a new custom AI Agent into the monitoring mesh
   */
  public spawnAgent(name: string, role: AiAgent['role'], modelBase: string): AiAgent {
    const id = `agent_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const now = Date.now();

    const newAgent: AiAgent = {
      id,
      name,
      role,
      modelBase,
      healthScore: 99,
      entropyDriftPct: 1.2,
      unauthorizedMemoryReads: 0,
      policyDeviationScore: 0.1,
      hallucinationRatePct: 0.2,
      status: 'HEALTHY',
      circuitBreakerState: 'CLOSED',
      circuitBreakerTripped: false,
      lastActive: now,
      activeUniGasTokenId: `tok_ugs_spawned_${Math.random().toString(16).substring(2, 8)}`,
      sandboxMemoryAddress: `0x7FFF00${Math.floor(Math.random() * 9000 + 1000).toString(16).toUpperCase()}000`,
      telemetry: {
        tokensPerSec: 160,
        inferenceLatencyMs: 12.0,
        contextWindowUsagePct: 15,
        memoryAllocatedMb: 320,
        cpuComputePct: 14,
        taskSuccessRate: 100,
        completedTasksCount: 0,
        errorCount: 0,
        gasBurnRateMicroGasMin: 60,
        history: Array(13).fill(null).map((_, i) => ({
          timestamp: now - (12 - i) * 2000,
          latencyMs: 12.0,
          entropy: 1.2,
          tokensPerSec: 160,
          cpu: 14
        }))
      },
      recentAnomalies: []
    };

    this.agents.push(newAgent);
    this.notify();
    return newAgent;
  }

  /**
   * Automated Recovery Function for corrupted or malfunctioning AI agents
   * 4-Stage Protocol:
   * Stage 1: Sandbox Freeze & Network Airgap
   * Stage 2: Memory Buffer Purge & Snapshot Rollback
   * Stage 3: Neural Weight / Policy Sanity Re-Alignment
   * Stage 4: Cryptographic Re-attestation & Zero-Trust Re-entry
   */
  public async executeAgentRecovery(agentId: string, onStepUpdate?: (step: number, label: string) => void): Promise<boolean> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return false;

    // Set to recovering
    this.agents = this.agents.map(a => (a.id === agentId ? { ...a, status: 'RECOVERING' as const, recoveryStep: 1 } : a));
    this.notify();

    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Step 1: Sandbox Freeze & Network Airgap
    onStepUpdate?.(1, 'Stage 1/4: Airgapping sandbox network & freezing execution thread');
    await wait(550);

    // Step 2: Memory Buffer Purge & Snapshot Rollback
    this.agents = this.agents.map(a => (a.id === agentId ? { ...a, recoveryStep: 2 } : a));
    this.notify();
    onStepUpdate?.(2, 'Stage 2/4: Purging corrupted memory buffers and rolling back state');
    await wait(650);

    // Step 3: Neural Weight Sanity Re-alignment
    this.agents = this.agents.map(a => (a.id === agentId ? { ...a, recoveryStep: 3 } : a));
    this.notify();
    onStepUpdate?.(3, 'Stage 3/4: Enforcing policy constitution and re-aligning weights');
    await wait(750);

    // Step 4: Cryptographic Re-attestation & Re-entry
    this.agents = this.agents.map(a => (a.id === agentId ? { ...a, recoveryStep: 4 } : a));
    this.notify();
    onStepUpdate?.(4, 'Stage 4/4: Issuing fresh UniGas ML-KEM token & restoring circuit breaker');
    await wait(550);

    // Finalize clean agent state
    this.agents = this.agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status: 'HEALTHY' as const,
          healthScore: 99,
          entropyDriftPct: 1.4,
          unauthorizedMemoryReads: 0,
          policyDeviationScore: 0.1,
          hallucinationRatePct: 0.3,
          circuitBreakerState: 'CLOSED' as const,
          circuitBreakerTripped: false,
          isolationProtocolTier: undefined,
          activeUniGasTokenId: `tok_ugs_RECOVERED_${Date.now().toString(36)}`,
          recoveryStep: undefined,
          telemetry: {
            ...a.telemetry,
            inferenceLatencyMs: 12.5,
            cpuComputePct: 18,
            errorCount: 0
          }
        };
      }
      return a;
    });

    // Check if global circuit breaker can return to CLOSED
    const anyStillTripped = this.agents.some(a => a.circuitBreakerTripped);
    if (!anyStillTripped) {
      this.globalCircuitBreaker = 'CLOSED';
    }

    AuditService.getInstance().logEvent(
      'sentinel-recovery-engine',
      'AI_AGENT_RECOVERY_COMPLETED',
      `Agent::${agentId}`,
      'SUCCESS',
      ['FIPS-203', 'SOC2-CC6']
    );

    this.notify();
    return true;
  }

  /**
   * Global Circuit Breaker Toggle
   */
  public setGlobalCircuitBreaker(state: 'CLOSED' | 'HALF_OPEN' | 'OPEN') {
    this.globalCircuitBreaker = state;
    if (state === 'OPEN') {
      // Trip all agents
      this.agents = this.agents.map(a => ({
        ...a,
        circuitBreakerState: 'OPEN' as const,
        circuitBreakerTripped: true,
        status: a.status === 'HEALTHY' ? 'ANOMALOUS' : a.status
      }));
    } else if (state === 'CLOSED') {
      this.agents = this.agents.map(a => ({
        ...a,
        circuitBreakerState: 'CLOSED' as const,
        circuitBreakerTripped: false,
        status: 'HEALTHY' as const,
        isolationProtocolTier: undefined
      }));
    }
    this.notify();
  }
   /**
   * Evaluates inbound agent prompt using local DFA engine and Cloud Run Sentinel Proxy
   */
  public async testAgentInboundPrompt(
    agentId: string,
    promptText: string
  ): Promise<{ allowed: boolean; vector?: AnomalyVector; rule?: string }> {
    const dfa = SentinelDfaEngine.getInstance();
    const scan = dfa.inspectPayload(promptText);

    if (scan.blocked && scan.vector) {
      // Trip agent circuit breaker and trigger automated isolation
      this.simulateAnomalyVector(agentId, scan.vector);
      return {
        allowed: false,
        vector: scan.vector,
        rule: scan.matchedPattern
      };
    }

    // Pass through to live Google Cloud Run Sentinel reverse proxy
    const proxy = SentinelProxyClient.getInstance();
    const proxyResult = await proxy.verifyAndDispatch(agentId, promptText);

    if (proxyResult.status === 'BLOCKED') {
      this.simulateAnomalyVector(agentId, 'POLICY_DEVIATION');
      return {
        allowed: false,
        vector: 'POLICY_DEVIATION',
        rule: 'CLOUD_RUN_SENTINEL_403'
      };
    }

    return { allowed: true };
  }
} // <--- This is the final closing bracket of AgentSentinelService

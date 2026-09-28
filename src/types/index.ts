export type PqcAlgorithm = 'ML-KEM-1024' | 'ML-DSA-87' | 'SLH-DSA-SPHINCS+' | 'Falcon-1024';

export interface PqcKeyPair {
  algorithm: PqcAlgorithm;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  matrixDimensions: string;
  createdAt: number;
}

export interface EncryptedPayload {
  cipherTextHex: string;
  encapsulatedKeyHex: string; // KEM ciphertext
  ivHex: string;
  tagHex: string;
  algorithm: PqcAlgorithm;
  hybridScheme: 'AES-256-GCM + ML-KEM-1024' | 'ChaCha20-Poly1305 + ML-KEM-1024';
  timestamp: number;
  metadata: {
    senderId: string;
    recipientId: string;
    gasUsed: number;
    latencyMs: number;
  };
}

export interface UniGasSession {
  sessionId: string;
  clientId: string;
  gasBalanceMicroGas: number; // e.g. 100,000 uG
  gasCostPerTx: number;
  ratchetEpoch: number;
  ephemeralPqcPubKey: string;
  authBindingToken: string; // JWT with bound PQC signature
  expiresAt: number;
  status: 'active' | 'rotated' | 'revoked' | 'exhausted';
}

export interface UniGasHandshakeStep {
  step: number;
  phase: string;
  sender: 'Client' | 'UniGas-Broker' | 'Auth-Gateway';
  action: string;
  payloadSummary: string;
  gasBurnedMicroGas: number;
  timestamp: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'WARNING' | 'ALERT' | 'BLOCKED';
  encryptedPayloadHash: string;
  pqcSignature: string; // ML-DSA signature
  previousBlockHash: string;
  tamperVerified: boolean;
  complianceTags: ('FIPS-203' | 'FIPS-204' | 'NIST-SP-800-208' | 'SOC2-CC6' | 'HIPAA-164.312' | 'FedRAMP-High')[];
}

export interface ComplianceReport {
  id: string;
  generatedAt: number;
  framework: 'NIST-SP-800-208' | 'FIPS-203/204/205' | 'SOC2-Type-II' | 'FedRAMP-High' | 'HIPAA-Security';
  overallScore: number;
  status: 'COMPLIANT' | 'NEEDS_REMEDIATION' | 'AUDIT_READY';
  totalEncryptedLogsEvaluated: number;
  quantumReadinessRatio: number;
  findings: {
    category: string;
    checkName: string;
    pass: boolean;
    quantumAssuranceLevel: 'Category 5 (ML-KEM-1024)' | 'Category 3' | 'Legacy Vulnerable';
    description: string;
  }[];
  attestationSignature: string;
  auditorOrg: string;
}

export interface SyncRecord {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  vectorClock: { [nodeId: string]: number };
  clientTimestamp: number;
  syncedToCloud: boolean;
  version: number;
  signature: string;
}

export interface DisasterRecoveryState {
  currentRegion: 'aws-us-east-1' | 'gcp-europe-west1' | 'azure-eastus' | 'airgap-onprem-vault';
  failoverMode: 'AUTOMATIC' | 'MANUAL';
  lastSnapshotTimestamp: number;
  rpoSeconds: number; // Recovery Point Objective
  rtoSeconds: number; // Recovery Time Objective
  backupVaultIntegrity: number; // percentage
  pitrSliderTimestamp: number;
  airgapSyncStatus: 'ONLINE_ACTIVE' | 'DEGRADED' | 'AIRGAP_ISOLATED';
}

export interface AsyncTask {
  id: string;
  title: string;
  type: 'PQC_REKEYING' | 'BULK_TELEMETRY_INGEST' | 'COMPLIANCE_PROOF_GEN' | 'AGENT_WEIGHT_ALIGNMENT' | 'DATASET_LATTICE_ENCRYPT';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DLQ';
  cloudWorker: 'AWS-Lambda-PQC-1' | 'GCP-CloudRun-PQC-2' | 'Azure-Edge-Container-3' | 'BareMetal-SIMD-Edge';
  progress: number;
  executionMs: number;
  retries: number;
  createdAt: number;
}

export type AnomalyVector = 
  | 'ENTROPY_DRIFT'
  | 'UNAUTHORIZED_MEMORY_PROBE'
  | 'POLICY_DEVIATION'
  | 'RECURSIVE_TOOL_LOOP'
  | 'LATENT_DEGENERACY'
  | 'EXFILTRATION_PROBE';

export interface AnomalyIncident {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  vector: AnomalyVector;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  metricValue: string;
  thresholdValue: string;
  triggeredIsolation: boolean;
  circuitBreakerAction: 'NONE' | 'TIER_1_THROTTLED' | 'TIER_2_EGRESS_CUT' | 'TIER_3_PURGED_AIRGAP' | 'GLOBAL_CLUSTER_TRIPPED';
}

export interface AgentPerformanceTelemetry {
  tokensPerSec: number;
  inferenceLatencyMs: number;
  contextWindowUsagePct: number;
  memoryAllocatedMb: number;
  cpuComputePct: number;
  taskSuccessRate: number; // 0-100%
  completedTasksCount: number;
  errorCount: number;
  gasBurnRateMicroGasMin: number;
  history: {
    timestamp: number;
    latencyMs: number;
    entropy: number;
    tokensPerSec: number;
    cpu: number;
  }[];
}

export interface IsolationProtocolConfig {
  autoQuarantineEnabled: boolean;
  entropyThresholdPct: number; // e.g. 18%
  unauthorizedProbesThreshold: number; // e.g. 2
  policyDeviationThreshold: number; // e.g. 7.0
  autoTripGlobalMeshThreshold: number; // e.g. 2 corrupted agents
  cooldownPeriodSec: number;
  memorySealOnTrip: boolean;
}

export interface AiAgent {
  id: string;
  name: string;
  role: 'Crypto-Sentinel' | 'Sync-Daemon' | 'Lattice-Indexer' | 'Edge-Telemetry-Predictor' | 'Autonomous-Executor' | 'Policy-Governor';
  modelBase: string; // e.g. 'ZeroLabz-Q-Transformer-v4'
  healthScore: number; // 0 - 100
  entropyDriftPct: number; // >18% is rogue
  unauthorizedMemoryReads: number;
  policyDeviationScore: number; // 0 - 10
  hallucinationRatePct: number;
  status: 'HEALTHY' | 'ANOMALOUS' | 'CORRUPTED_ROGUE' | 'QUARANTINED_ISOLATED' | 'RECOVERING';
  circuitBreakerState: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  circuitBreakerTripped: boolean;
  lastActive: number;
  activeUniGasTokenId: string;
  sandboxMemoryAddress: string;
  recoveryStep?: number; // 1 to 4
  telemetry: AgentPerformanceTelemetry;
  recentAnomalies: AnomalyIncident[];
  isolationProtocolTier?: 'TIER_1_THROTTLED' | 'TIER_2_EGRESS_CUT' | 'TIER_3_PURGED_AIRGAP';
}

export interface EdgeStreamMetric {
  timestamp: number;
  throughputKBSec: number;
  packetsProcessedPerSec: number;
  edgeLatencyMicroSec: number; // in microseconds (e.g. 420 us = 0.42ms)
  activeSensors: number;
  batteryDrawMilliWatts: number;
  thermalStatus: 'NORMAL' | 'WARM' | 'OPTIMAL';
}

export type BatteryProfile = 'ULTRA_LOW_POWER' | 'BALANCED_MOBILE' | 'MISSION_CRITICAL_TURBO';

export interface MicroserviceHealth {
  name: string;
  serviceId: string;
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'TRIPPED';
  latencyMs: number;
  pqcEnabled: boolean;
  instancesCount: number;
}

export interface AutomationTriggerSettings {
  autoHealEnabled: boolean;
  autoHealDelaySec: number;
  autoHealMaxRetries: number;
  autoHealHealthThreshold: number;
  autoHealEntropyThreshold: number;
  autoSyncEnabled: boolean;
  autoSyncOnReconnect: boolean;
  autoSyncIntervalSec: number;
  autoSyncQueueSizeThreshold: number;
  autoFailoverEnabled: boolean;
  autoFailoverLatencyThresholdMs: number;
  autoRekeyEnabled: boolean;
  autoRekeyThresholdMicroGas: number;
}

export interface AutomationEvent {
  id: string;
  timestamp: number;
  triggerType: 'AUTO_HEAL' | 'AUTO_SYNC' | 'AUTO_FAILOVER' | 'AUTO_REKEY' | 'AUTO_QUARANTINE';
  title: string;
  details: string;
  status: 'EXECUTED' | 'IN_PROGRESS' | 'RETRYING' | 'SKIPPED';
}


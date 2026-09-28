import { MicroserviceHealth } from '../types';

export class MicroservicesMesh {
  private static instance: MicroservicesMesh;

  private services: MicroserviceHealth[] = [
    {
      name: 'PQC Vault Microservice',
      serviceId: 'svc-pqc-vault-01',
      endpoint: '/api/v2/pqc/lattice-kem',
      status: 'HEALTHY',
      latencyMs: 1.2,
      pqcEnabled: true,
      instancesCount: 12
    },
    {
      name: 'UniGas Key Exchange Broker',
      serviceId: 'svc-unigas-broker-02',
      endpoint: '/api/v2/unigas/ratchet-epoch',
      status: 'HEALTHY',
      latencyMs: 0.8,
      pqcEnabled: true,
      instancesCount: 8
    },
    {
      name: 'Post-Quantum Audit Ledger',
      serviceId: 'svc-audit-ledger-03',
      endpoint: '/api/v2/audit/fips-chain',
      status: 'HEALTHY',
      latencyMs: 1.9,
      pqcEnabled: true,
      instancesCount: 6
    },
    {
      name: 'CRDT Offline Sync Mesh',
      serviceId: 'svc-crdt-sync-04',
      endpoint: '/api/v2/sync/vector-clocks',
      status: 'HEALTHY',
      latencyMs: 2.1,
      pqcEnabled: true,
      instancesCount: 16
    },
    {
      name: 'Disaster Recovery PITR Engine',
      serviceId: 'svc-disaster-recovery-05',
      endpoint: '/api/v2/dr/multi-cloud-pitr',
      status: 'HEALTHY',
      latencyMs: 3.4,
      pqcEnabled: true,
      instancesCount: 4
    },
    {
      name: 'Async Task Distributed Scaler',
      serviceId: 'svc-task-scaler-06',
      endpoint: '/api/v2/tasks/queue-dispatch',
      status: 'HEALTHY',
      latencyMs: 1.4,
      pqcEnabled: true,
      instancesCount: 24
    },
    {
      name: 'AI Sentinel & Circuit Breaker Guardrail',
      serviceId: 'svc-sentinel-guard-07',
      endpoint: '/api/v2/sentinel/isolation-gate',
      status: 'HEALTHY',
      latencyMs: 0.9,
      pqcEnabled: true,
      instancesCount: 8
    },
    {
      name: 'Edge Stream Analytics & Battery Governor',
      serviceId: 'svc-edge-stream-08',
      endpoint: '/api/v2/edge/stream-analyzer',
      status: 'HEALTHY',
      latencyMs: 0.4,
      pqcEnabled: true,
      instancesCount: 32
    }
  ];

  public static getInstance(): MicroservicesMesh {
    if (!MicroservicesMesh.instance) {
      MicroservicesMesh.instance = new MicroservicesMesh();
    }
    return MicroservicesMesh.instance;
  }

  public getServices(): MicroserviceHealth[] {
    return this.services;
  }
}

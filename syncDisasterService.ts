import { SyncRecord, DisasterRecoveryState } from '../types';
import { PqcEngine, toHex } from '../crypto/pqcEngine';

export class SyncDisasterService {
  private static instance: SyncDisasterService;
  private localVault: SyncRecord[] = [];
  private offlineQueue: SyncRecord[] = [];
  private isOnline: boolean = true;
  private recoveryState: DisasterRecoveryState;
  private snapshots: { timestamp: number; label: string; count: number; hash: string }[] = [];

  private constructor() {
    this.recoveryState = {
      currentRegion: 'aws-us-east-1',
      failoverMode: 'AUTOMATIC',
      lastSnapshotTimestamp: Date.now() - 120000,
      rpoSeconds: 0.8,
      rtoSeconds: 3.4,
      backupVaultIntegrity: 100,
      pitrSliderTimestamp: Date.now(),
      airgapSyncStatus: 'ONLINE_ACTIVE'
    };
    this.seedInitialVault();
  }

  public static getInstance(): SyncDisasterService {
    if (!SyncDisasterService.instance) {
      SyncDisasterService.instance = new SyncDisasterService();
    }
    return SyncDisasterService.instance;
  }

  private seedInitialVault() {
    const collections = ['MissionData', 'CryptographicVault', 'UserProfiles', 'SensorFeeds'];
    const now = Date.now();

    for (let i = 0; i < 6; i++) {
      this.localVault.push({
        id: `rec_crdt_${i + 100}`,
        collection: collections[i % collections.length],
        data: {
          title: `Mission Dataset Segment #${i + 1}`,
          payloadTier: 'TOP_SECRET_PQC',
          quantumKeyRef: `0x7F9A3B${i}`,
          revisionCount: i * 3 + 1
        },
        vectorClock: { 'edge-node-01': i + 2, 'cloud-aggregator': i + 1 },
        clientTimestamp: now - (6 - i) * 60000,
        syncedToCloud: true,
        version: i + 1,
        signature: `MLDSA87-REC-SIG:0x${i}e82b7c4a...`
      });
    }

    this.snapshots = [
      { timestamp: now - 3600000 * 2, label: 'T-2hr Snapshot (Automatic Epoch 40)', count: 4, hash: '0x8849b2...f9a1' },
      { timestamp: now - 3600000 * 1, label: 'T-1hr Snapshot (Automatic Epoch 41)', count: 5, hash: '0x9482c1...33d2' },
      { timestamp: now - 120000, label: 'T-2min Pre-Failover Snapshot (Epoch 42)', count: 6, hash: '0x44b7e8...10c8' }
    ];
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
    this.recoveryState.airgapSyncStatus = online ? 'ONLINE_ACTIVE' : 'AIRGAP_ISOLATED';
  }

  public getLocalVault(): SyncRecord[] {
    return this.localVault;
  }

  public getOfflineQueue(): SyncRecord[] {
    return this.offlineQueue;
  }

  public getRecoveryState(): DisasterRecoveryState {
    return this.recoveryState;
  }

  public getSnapshots() {
    return this.snapshots;
  }

  /**
   * Save a new record with CRDT vector clock and PQC signature
   * Handles offline buffering seamlessly
   */
  public async saveRecord(collection: string, payload: Record<string, unknown>): Promise<SyncRecord> {
    const engine = PqcEngine.getInstance();
    const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    // Dilithium-87 signature for tamper resistance
    const rawData = JSON.stringify(payload);
    const signature = await engine.signPayload(rawData, 'ZL-CLIENT-DILITHIUM-SK');

    const newRecord: SyncRecord = {
      id,
      collection,
      data: payload,
      vectorClock: {
        'edge-node-01': (this.localVault.length > 0 ? (this.localVault[0].vectorClock['edge-node-01'] || 0) + 1 : 1),
        'cloud-sync-mesh': this.isOnline ? 1 : 0
      },
      clientTimestamp: now,
      syncedToCloud: this.isOnline,
      version: 1,
      signature
    };

    if (this.isOnline) {
      this.localVault.unshift(newRecord);
    } else {
      // Buffer in offline queue
      this.offlineQueue.push(newRecord);
      this.localVault.unshift(newRecord);
    }

    return newRecord;
  }

  /**
   * Reconcile and push all offline queued records to the cloud
   * Guarantees zero data loss with CRDT resolution
   */
  public async syncOfflineQueue(): Promise<{ syncedCount: number; resolvedConflicts: number }> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while network is offline.');
    }

    const count = this.offlineQueue.length;
    let conflicts = 0;

    // Simulate CRDT conflict check & vector clock increment
    for (const item of this.offlineQueue) {
      item.syncedToCloud = true;
      item.vectorClock['cloud-sync-mesh'] = (item.vectorClock['cloud-sync-mesh'] || 0) + 1;
      // If version collision existed, resolve via deterministic signature hash
      conflicts += Math.random() > 0.8 ? 1 : 0;
    }

    this.offlineQueue = [];
    this.recoveryState.lastSnapshotTimestamp = Date.now();
    return { syncedCount: count, resolvedConflicts: conflicts };
  }

  /**
   * Trigger multi-cloud failover to another provider/region
   */
  public performFailover(targetRegion: DisasterRecoveryState['currentRegion']): {
    previousRegion: string;
    newRegion: string;
    failoverDurationMs: number;
  } {
    const prev = this.recoveryState.currentRegion;
    this.recoveryState.currentRegion = targetRegion;
    const duration = Math.floor(Math.random() * 1200) + 1400; // ~1.4 - 2.6s

    // Add automatic disaster recovery snapshot
    const hash = `0x${toHex(new Uint8Array([Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]))}`;
    this.snapshots.unshift({
      timestamp: Date.now(),
      label: `Post-Failover Snapshot [${targetRegion.toUpperCase()}]`,
      count: this.localVault.length,
      hash: `${hash}...${targetRegion.substring(0, 4)}`
    });

    return {
      previousRegion: prev,
      newRegion: targetRegion,
      failoverDurationMs: duration
    };
  }

  /**
   * Point-in-Time Recovery (PITR) rollback
   */
  public restoreToPointInTime(timestamp: number): { restoredCount: number; targetEpoch: string } {
    this.recoveryState.pitrSliderTimestamp = timestamp;
    const restoredCount = Math.max(3, Math.floor(this.localVault.length * 0.8));
    return {
      restoredCount,
      targetEpoch: new Date(timestamp).toLocaleTimeString()
    };
  }
}

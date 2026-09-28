import { AutomationTriggerSettings, AutomationEvent } from '../types';
import { AgentSentinelService } from './agentSentinelService';
import { SyncDisasterService } from './syncDisasterService';
import { UniGasService } from './unigasService';
import { AuditService } from './auditService';

export class AutomationService {
  private static instance: AutomationService;

  private settings: AutomationTriggerSettings = {
    // Auto-Heal
    autoHealEnabled: true,
    autoHealDelaySec: 2,
    autoHealMaxRetries: 3,
    autoHealHealthThreshold: 50,
    autoHealEntropyThreshold: 18.0,

    // Auto-Sync
    autoSyncEnabled: true,
    autoSyncOnReconnect: true,
    autoSyncIntervalSec: 10,
    autoSyncQueueSizeThreshold: 2,

    // Auto-Failover & Rekey
    autoFailoverEnabled: true,
    autoFailoverLatencyThresholdMs: 120,
    autoRekeyEnabled: true,
    autoRekeyThresholdMicroGas: 20000
  };

  private events: AutomationEvent[] = [];
  private listeners: ((events: AutomationEvent[]) => void)[] = [];
  private settingsListeners: ((settings: AutomationTriggerSettings) => void)[] = [];
  private agentRetryMap: Record<string, number> = {};
  private loopInterval: NodeJS.Timeout | null = null;
  private lastPeriodicSyncTime: number = Date.now();
  private wasOffline: boolean = false;

  private constructor() {
    this.seedInitialEvents();
    this.startAutomationLoop();
  }

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private seedInitialEvents() {
    const now = Date.now();
    this.events = [
      {
        id: 'auto_ev_01',
        timestamp: now - 180000,
        triggerType: 'AUTO_SYNC',
        title: 'Auto-Sync: CRDT Queue Reconciled',
        details: 'Reconciled 3 offline buffered records upon network reconnection. Zero data loss.',
        status: 'EXECUTED'
      },
      {
        id: 'auto_ev_02',
        timestamp: now - 90000,
        triggerType: 'AUTO_REKEY',
        title: 'Auto-Rekey: UniGas Epoch Rotated',
        details: 'Rotated ML-KEM-1024 ephemeral keypair as gas consumption reached threshold.',
        status: 'EXECUTED'
      }
    ];
  }

  private logEvent(triggerType: AutomationEvent['triggerType'], title: string, details: string, status: AutomationEvent['status'] = 'EXECUTED') {
    const newEvent: AutomationEvent = {
      id: `auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      triggerType,
      title,
      details,
      status
    };
    this.events.unshift(newEvent);
    if (this.events.length > 40) {
      this.events.pop();
    }
    this.notify();
  }

  private startAutomationLoop() {
    if (this.loopInterval) return;

    this.loopInterval = setInterval(() => {
      this.evaluateAutoSync();
      this.evaluateAutoHeal();
      this.evaluateAutoRekey();
    }, 1500);
  }

  /**
   * Automated Health Surveillance & Self-Healing Trigger
   */
  private async evaluateAutoHeal() {
    if (!this.settings.autoHealEnabled) return;

    const sentinel = AgentSentinelService.getInstance();
    const agents = sentinel.getAgents();

    for (const agent of agents) {
      const isCorrupted = agent.status === 'CORRUPTED_ROGUE' || agent.status === 'QUARANTINED_ISOLATED';
      const isAnomalous = agent.status === 'ANOMALOUS';
      const isHealthBreached = agent.healthScore < this.settings.autoHealHealthThreshold;
      const isEntropyBreached = agent.entropyDriftPct >= this.settings.autoHealEntropyThreshold;

      if ((isCorrupted || isAnomalous || isHealthBreached || isEntropyBreached) && agent.status !== 'RECOVERING') {
        const retries = this.agentRetryMap[agent.id] || 0;
        if (retries >= this.settings.autoHealMaxRetries) {
          continue; // Exceeded auto-heal retries
        }

        // Trigger Auto-Heal
        this.agentRetryMap[agent.id] = retries + 1;
        this.logEvent(
          'AUTO_HEAL',
          `Auto-Heal Triggered: ${agent.name}`,
          `Autonomous 4-stage restoration initiated (Attempt ${retries + 1}/${this.settings.autoHealMaxRetries}). Triggered by ${isEntropyBreached ? `entropy drift (${agent.entropyDriftPct}%)` : `health score (${agent.healthScore}%)`}.`,
          'IN_PROGRESS'
        );

        setTimeout(async () => {
          try {
            await sentinel.executeAgentRecovery(agent.id);
            this.logEvent(
              'AUTO_HEAL',
              `Auto-Heal Succeeded: ${agent.name}`,
              `Agent sanitized, neural weights realigned, and re-admitted to cluster under fresh ML-KEM-1024 token.`,
              'EXECUTED'
            );
          } catch (err) {
            this.logEvent(
              'AUTO_HEAL',
              `Auto-Heal Failed: ${agent.name}`,
              `Recovery failed. Agent kept in secure airgap quarantine.`,
              'RETRYING'
            );
          }
        }, this.settings.autoHealDelaySec * 1000);

        break; // Process one at a time to prevent concurrent lock
      }
    }
  }

  /**
   * Automated Offline-First Synchronization Trigger
   */
  private async evaluateAutoSync() {
    if (!this.settings.autoSyncEnabled) return;

    const syncService = SyncDisasterService.getInstance();
    const isOnline = syncService.getIsOnline();
    const offlineQueue = syncService.getOfflineQueue();
    const now = Date.now();

    // Trigger on network reconnect
    if (isOnline && this.wasOffline && this.settings.autoSyncOnReconnect) {
      this.wasOffline = false;
      if (offlineQueue.length > 0) {
        try {
          const res = await syncService.syncOfflineQueue();
          this.logEvent(
            'AUTO_SYNC',
            'Auto-Sync: Reconnect Trigger Activated',
            `Network re-established. Automatically synced ${res.syncedCount} buffered records with zero data loss.`,
            'EXECUTED'
          );
        } catch {
          // Ignore
        }
        return;
      }
    }
    this.wasOffline = !isOnline;

    if (!isOnline) return;

    // Trigger on queue threshold
    if (offlineQueue.length >= this.settings.autoSyncQueueSizeThreshold) {
      try {
        const res = await syncService.syncOfflineQueue();
        this.logEvent(
          'AUTO_SYNC',
          'Auto-Sync: Queue Threshold Trigger',
          `Buffer reached ${this.settings.autoSyncQueueSizeThreshold} items. Flushed and reconciled ${res.syncedCount} records.`,
          'EXECUTED'
        );
        this.lastPeriodicSyncTime = now;
      } catch {
        // Ignore
      }
      return;
    }

    // Trigger periodic sync interval
    if (now - this.lastPeriodicSyncTime >= this.settings.autoSyncIntervalSec * 1000) {
      this.lastPeriodicSyncTime = now;
      if (offlineQueue.length > 0) {
        try {
          const res = await syncService.syncOfflineQueue();
          this.logEvent(
            'AUTO_SYNC',
            'Auto-Sync: Periodic Interval Trigger',
            `Periodic timer (${this.settings.autoSyncIntervalSec}s) flushed ${res.syncedCount} pending mutations.`,
            'EXECUTED'
          );
        } catch {
          // Ignore
        }
      }
    }
  }

  /**
   * Automated Post-Quantum Ephemeral Re-Keying
   */
  private evaluateAutoRekey() {
    if (!this.settings.autoRekeyEnabled) return;

    const unigas = UniGasService.getInstance();
    const session = unigas.getSession();

    if (session && session.gasBalanceMicroGas < this.settings.autoRekeyThresholdMicroGas) {
      unigas.consumeGas(0); // Triggers internal top-up & ratchet epoch
      this.logEvent(
        'AUTO_REKEY',
        'Auto-Rekey: Ephemeral Ratchet Rotated',
        `Gas reserve approached threshold (${this.settings.autoRekeyThresholdMicroGas.toLocaleString()} μG). Automatically ratified Epoch #${session.ratchetEpoch + 1}.`,
        'EXECUTED'
      );
    }
  }

  public getSettings(): AutomationTriggerSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AutomationTriggerSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.settingsListeners.forEach(cb => cb({ ...this.settings }));
    this.logEvent(
      'AUTO_QUARANTINE',
      'Automation Triggers Updated',
      `Custom trigger thresholds reconfigured by operator. Auto-Heal: ${this.settings.autoHealEnabled ? 'ON' : 'OFF'}, Auto-Sync: ${this.settings.autoSyncEnabled ? 'ON' : 'OFF'}.`,
      'EXECUTED'
    );
  }

  public getEvents(): AutomationEvent[] {
    return this.events;
  }

  public subscribe(cb: (events: AutomationEvent[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public subscribeSettings(cb: (settings: AutomationTriggerSettings) => void) {
    this.settingsListeners.push(cb);
    return () => {
      this.settingsListeners = this.settingsListeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.events]));
  }
}

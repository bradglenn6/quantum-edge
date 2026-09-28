import { BatteryProfile, EdgeStreamMetric } from '../types';

export interface EdgePacket {
  id: string;
  timestamp: number;
  sourceNode: string;
  sizeBytes: number;
  pqcVerified: boolean;
  latticeModulus: string;
  latencyMicroSec: number;
  anomalyScore: number;
}

export class EdgeStreamService {
  private static instance: EdgeStreamService;
  private currentProfile: BatteryProfile = 'BALANCED_MOBILE';
  private metricsHistory: EdgeStreamMetric[] = [];
  private livePackets: EdgePacket[] = [];
  private listeners: ((metric: EdgeStreamMetric, packets: EdgePacket[]) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.seedHistory();
    this.startStreamingSimulation();
  }

  public static getInstance(): EdgeStreamService {
    if (!EdgeStreamService.instance) {
      EdgeStreamService.instance = new EdgeStreamService();
    }
    return EdgeStreamService.instance;
  }

  private seedHistory() {
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      this.metricsHistory.push({
        timestamp: now - i * 1000,
        throughputKBSec: 820 + Math.sin(i) * 90,
        packetsProcessedPerSec: 1240 + Math.floor(Math.cos(i) * 120),
        edgeLatencyMicroSec: 410 + Math.floor(Math.sin(i) * 30),
        activeSensors: 48,
        batteryDrawMilliWatts: 18.2,
        thermalStatus: 'OPTIMAL'
      });
    }
  }

  private startStreamingSimulation() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const profile = this.currentProfile;

      // Parameters based on profile
      let baseLatency = 420;
      let baseThroughput = 1200;
      let basePackets = 1800;
      let power = 18.5;
      let thermal: EdgeStreamMetric['thermalStatus'] = 'OPTIMAL';

      if (profile === 'ULTRA_LOW_POWER') {
        baseLatency = 980; // 0.98 ms
        baseThroughput = 450;
        basePackets = 620;
        power = 4.2;
        thermal = 'NORMAL';
      } else if (profile === 'MISSION_CRITICAL_TURBO') {
        baseLatency = 340; // 0.34 ms
        baseThroughput = 2400;
        basePackets = 3850;
        power = 48.2;
        thermal = 'WARM';
      }

      const jitter = (Math.random() - 0.5) * 40;
      const latestMetric: EdgeStreamMetric = {
        timestamp: now,
        throughputKBSec: Math.round(baseThroughput + jitter * 4),
        packetsProcessedPerSec: Math.round(basePackets + jitter * 6),
        edgeLatencyMicroSec: Math.round(baseLatency + jitter),
        activeSensors: 64,
        batteryDrawMilliWatts: parseFloat((power + (Math.random() - 0.5) * 1.2).toFixed(1)),
        thermalStatus: thermal
      };

      this.metricsHistory.push(latestMetric);
      if (this.metricsHistory.length > 30) {
        this.metricsHistory.shift();
      }

      // Generate a live packet
      const packet: EdgePacket = {
        id: `pkt_${now.toString(36).substring(4)}_${Math.floor(Math.random() * 99)}`,
        timestamp: now,
        sourceNode: `edge-sensor-${(Math.floor(Math.random() * 8) + 1).toString().padStart(2, '0')}`,
        sizeBytes: Math.floor(Math.random() * 400) + 128,
        pqcVerified: true,
        latticeModulus: profile === 'ULTRA_LOW_POWER' ? 'q=257 (8-bit)' : 'q=3329 (ML-KEM)',
        latencyMicroSec: Math.round(baseLatency + (Math.random() - 0.5) * 30),
        anomalyScore: parseFloat((Math.random() * 0.15).toFixed(3))
      };

      this.livePackets.unshift(packet);
      if (this.livePackets.length > 15) {
        this.livePackets.pop();
      }

      this.notify(latestMetric, this.livePackets);
    }, 1000);
  }

  public subscribe(cb: (metric: EdgeStreamMetric, packets: EdgePacket[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify(metric: EdgeStreamMetric, packets: EdgePacket[]) {
    this.listeners.forEach(cb => cb(metric, packets));
  }

  public getProfile(): BatteryProfile {
    return this.currentProfile;
  }

  public setProfile(profile: BatteryProfile) {
    this.currentProfile = profile;
  }

  public getHistory(): EdgeStreamMetric[] {
    return this.metricsHistory;
  }

  public getPackets(): EdgePacket[] {
    return this.livePackets;
  }
}

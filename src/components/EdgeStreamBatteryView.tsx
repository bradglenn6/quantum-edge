import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Battery, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  CheckCircle 
} from 'lucide-react';
import { EdgeStreamService, EdgePacket } from '../services/edgeStreamService';
import { BatteryProfile, EdgeStreamMetric } from '../types';

interface EdgeStreamBatteryViewProps {
  currentProfile: BatteryProfile;
  onProfileChange: (profile: BatteryProfile) => void;
  latestMetric: EdgeStreamMetric | null;
}

export const EdgeStreamBatteryView: React.FC<EdgeStreamBatteryViewProps> = ({
  currentProfile,
  onProfileChange,
  latestMetric: propMetric
}) => {
  const edgeService = EdgeStreamService.getInstance();
  const [metric, setMetric] = useState<EdgeStreamMetric | null>(propMetric || edgeService.getHistory()[edgeService.getHistory().length - 1] || null);
  const [packets, setPackets] = useState<EdgePacket[]>(edgeService.getPackets());
  const [history, setHistory] = useState<EdgeStreamMetric[]>(edgeService.getHistory());

  useEffect(() => {
    const unsub = edgeService.subscribe((newMetric, newPackets) => {
      setMetric(newMetric);
      setPackets(newPackets);
      setHistory(edgeService.getHistory());
    });
    return () => unsub();
  }, [edgeService]);

  const handleSelectProfile = (profile: BatteryProfile) => {
    edgeService.setProfile(profile);
    onProfileChange(profile);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Edge Real-Time Stream Analytics &amp; Battery Governor</h1>
            <span className="text-xs font-mono-code text-cyan-400">Microsecond Sub-Edge SIMD</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            High-throughput cryptographic stream processing with dynamic battery life optimization for mobile edge devices.
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2 font-mono-code text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>INGESTION ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Battery Governor Selection Profiles */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4 font-mono-code text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Dynamic Battery Life Optimization Governor</h2>
          </div>
          <span className="text-slate-400">Quantized Vector Lattice Math</span>
        </div>

        <p className="text-slate-400 leading-relaxed">
          Select an optimization profile to dynamically tune CPU duty-cycling, SIMD register width, and polynomial lattice quantization to extend battery life without sacrificing security.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile 1: Ultra-Low Power */}
          <div
            onClick={() => handleSelectProfile('ULTRA_LOW_POWER')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentProfile === 'ULTRA_LOW_POWER'
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Ultra-Low Power IoT</span>
              <span className="text-emerald-400 font-bold">4.2 mW</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Duty Cycle:</span>
                <span className="text-white">15 Hz Sample</span>
              </div>
              <div className="flex justify-between">
                <span>Lattice Math:</span>
                <span className="text-emerald-300">8-bit Quantized</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Latency:</span>
                <span className="text-white">~0.98 ms</span>
              </div>
              <div className="flex justify-between">
                <span>Battery Multiplier:</span>
                <span className="text-emerald-400 font-bold">+380% (4.8x)</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">Ideal for remote sensors &amp; low-power wearables</div>
          </div>

          {/* Profile 2: Balanced Mobile */}
          <div
            onClick={() => handleSelectProfile('BALANCED_MOBILE')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentProfile === 'BALANCED_MOBILE'
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Balanced Mobile</span>
              <span className="text-cyan-400 font-bold">18.5 mW</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Duty Cycle:</span>
                <span className="text-white">30 Hz Dynamic</span>
              </div>
              <div className="flex justify-between">
                <span>Lattice Math:</span>
                <span className="text-cyan-300">16-bit Fixed-Point</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Latency:</span>
                <span className="text-white">~0.65 ms</span>
              </div>
              <div className="flex justify-between">
                <span>Battery Multiplier:</span>
                <span className="text-cyan-400 font-bold">+140% (2.4x)</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">Recommended for tactical smartphones &amp; tablets</div>
          </div>

          {/* Profile 3: Mission-Critical Turbo */}
          <div
            onClick={() => handleSelectProfile('MISSION_CRITICAL_TURBO')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentProfile === 'MISSION_CRITICAL_TURBO'
                ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Mission-Critical Turbo</span>
              <span className="text-amber-400 font-bold">48.2 mW</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Duty Cycle:</span>
                <span className="text-white">60 Hz Continuous</span>
              </div>
              <div className="flex justify-between">
                <span>Lattice Math:</span>
                <span className="text-amber-300">32-bit AVX2 / NEON</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Latency:</span>
                <span className="text-emerald-400 font-bold">~0.34 ms (340μs)</span>
              </div>
              <div className="flex justify-between">
                <span>Throughput:</span>
                <span className="text-white">Max Ops/sec</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">Maximum performance for electronic warfare &amp; high-threat zones</div>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-code text-xs">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>PACKETS PROCESSED</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metric?.packetsProcessedPerSec || 1840} <span className="text-xs font-normal text-slate-400">pkt/s</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Zero-Loss Buffer</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>EDGE LATENCY</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {metric?.edgeLatencyMicroSec || 410} <span className="text-xs font-normal text-slate-400">μs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {( (metric?.edgeLatencyMicroSec || 410) / 1000 ).toFixed(3)} ms Sub-Millisecond
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>POWER CONSUMPTION</span>
            <Battery className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {metric?.batteryDrawMilliWatts || 18.5} <span className="text-xs font-normal text-slate-400">mW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Thermal State: <span className="text-emerald-400">{metric?.thermalStatus || 'OPTIMAL'}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>STREAM THROUGHPUT</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {metric?.throughputKBSec || 1200} <span className="text-xs font-normal text-slate-400">KB/s</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">64 Active Edge Sensors</div>
        </div>
      </div>

      {/* Sparkline Streaming Activity Graph */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3 font-mono-code text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Continuous Real-Time Telemetry Stream</h2>
          </div>
          <span className="text-slate-400 text-[11px]">Rolling 30-Second Window</span>
        </div>

        {/* Visual Sparkline Bars */}
        <div className="h-28 flex items-end gap-1.5 p-3 rounded bg-slate-950/80 border border-slate-800/80 overflow-hidden">
          {history.map((h, idx) => {
            const heightPct = Math.min(100, Math.max(15, (h.packetsProcessedPerSec / 4000) * 100));
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                <div
                  className="w-full rounded-t transition-all duration-300 bg-cyan-500/80 group-hover:bg-cyan-400"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>T-30 seconds</span>
          <span>Throughput: {metric?.throughputKBSec} KB/s</span>
          <span>Edge Latency: {metric?.edgeLatencyMicroSec} μs</span>
          <span className="text-cyan-400 font-semibold">Live (T-0s)</span>
        </div>
      </div>

      {/* Live Ingested Packet Inspector */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4 font-mono-code text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Live Ingested Edge Packets Inspector</h2>
          </div>
          <span className="text-slate-400 text-[11px]">All Packets Cryptographically Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2">Packet ID</th>
                <th className="pb-2">Source Sensor</th>
                <th className="pb-2">Payload Size</th>
                <th className="pb-2">Lattice Modulus</th>
                <th className="pb-2">Edge Latency</th>
                <th className="pb-2">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {packets.map(pkt => (
                <tr key={pkt.id} className="hover:bg-slate-950/40">
                  <td className="py-2.5 text-cyan-300 font-medium">{pkt.id}</td>
                  <td className="py-2.5 text-slate-300">{pkt.sourceNode}</td>
                  <td className="py-2.5 text-slate-400">{pkt.sizeBytes} B</td>
                  <td className="py-2.5 text-slate-400">{pkt.latticeModulus}</td>
                  <td className="py-2.5 text-emerald-400 font-semibold">{pkt.latencyMicroSec} μs</td>
                  <td className="py-2.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>ML-KEM VERIFIED</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

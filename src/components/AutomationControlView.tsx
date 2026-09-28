import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  RotateCcw, 
  RefreshCw, 
  Sliders, 
  CheckCircle, 
  Clock, 
  Play, 
  ShieldCheck, 
  Zap, 
  Server,
  Activity
} from 'lucide-react';
import { AutomationService } from '../services/automationService';
import { AutomationTriggerSettings, AutomationEvent } from '../types';
import { AgentSentinelService } from '../services/agentSentinelService';
import { SyncDisasterService } from '../services/syncDisasterService';

export const AutomationControlView: React.FC = () => {
  const autoService = AutomationService.getInstance();
  const sentinelService = AgentSentinelService.getInstance();
  const syncService = SyncDisasterService.getInstance();

  const [settings, setSettings] = useState<AutomationTriggerSettings>(autoService.getSettings());
  const [events, setEvents] = useState<AutomationEvent[]>(autoService.getEvents());
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubEvents = autoService.subscribe(evs => setEvents(evs));
    const unsubSettings = autoService.subscribeSettings(st => setSettings(st));
    return () => {
      unsubEvents();
      unsubSettings();
    };
  }, [autoService]);

  const handleUpdate = (partial: Partial<AutomationTriggerSettings>) => {
    autoService.updateSettings(partial);
    setSettings(autoService.getSettings());
  };

  const handleTestAutoHeal = () => {
    const agents = sentinelService.getAgents();
    const target = agents.find(a => a.status === 'HEALTHY') || agents[0];
    if (target) {
      setTestFeedback(`Injected entropy breach into ${target.name}. Watching Auto-Heal autonomous restoration...`);
      sentinelService.simulateAnomalyVector(target.id, 'ENTROPY_DRIFT');
      setTimeout(() => setTestFeedback(null), 5000);
    }
  };

  const handleTestAutoSync = async () => {
    await syncService.saveRecord('MissionData', {
      title: `Automated Trigger Probe #${Math.floor(Math.random() * 900) + 100}`,
      timestamp: Date.now(),
      status: 'AUTO_BUFFERED'
    });
    setTestFeedback(`Added record to buffer. Auto-Sync trigger will automatically flush and reconcile...`);
    setTimeout(() => setTestFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 font-mono-code text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Trigger Engine &amp; Auto-Heal Mesh</h1>
            <span className="text-xs text-cyan-400">Zero-Touch Operations</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated self-healing triggers for corrupted AI agents, zero-data-loss auto-synchronization, and adaptive failover controls.
          </p>
        </div>

        {/* Quick Test Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAutoHeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Auto-Heal Trigger</span>
          </button>
          <button
            onClick={handleTestAutoSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Auto-Sync Trigger</span>
          </button>
        </div>
      </div>

      {/* Test Feedback Toast */}
      {testFeedback && (
        <div className="p-3 rounded bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <span>{testFeedback}</span>
        </div>
      )}

      {/* Main Trigger Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Auto-Heal Trigger Customization */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Auto-Heal Trigger Customization</h2>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              settings.autoHealEnabled ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {settings.autoHealEnabled ? 'AUTO-HEAL ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            When an agent malfunctions, exceeds entropy thresholds, or gets quarantined, the Auto-Heal engine automatically performs memory sanitization, weights realignment, and zero-trust re-admission.
          </p>

          <div className="space-y-4 p-4 rounded bg-slate-950/80 border border-slate-800">
            {/* Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div>
                <span className="font-semibold text-white block">Enable Autonomous Self-Healing</span>
                <span className="text-[10px] text-slate-500">Automatically recovers corrupted agents without human intervention</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoHealEnabled}
                onChange={e => handleUpdate({ autoHealEnabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Delay Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Auto-Heal Activation Delay:</span>
                <span className="text-cyan-400 font-bold">{settings.autoHealDelaySec}s</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.autoHealDelaySec}
                onChange={e => handleUpdate({ autoHealDelaySec: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1s (Instant)</span>
                <span>5s (Standard)</span>
                <span>10s (Extended Soak)</span>
              </div>
            </div>

            {/* Max Retries */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Max Autonomous Recovery Attempts:</span>
                <span className="text-amber-400 font-bold">{settings.autoHealMaxRetries} Retries</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.autoHealMaxRetries}
                onChange={e => handleUpdate({ autoHealMaxRetries: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                If recovery fails {settings.autoHealMaxRetries} times, the agent is kept in permanent airgap isolation.
              </div>
            </div>

            {/* Health Trigger Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Trigger Auto-Heal if Health Drops Below:</span>
                <span className="text-emerald-400 font-bold">{settings.autoHealHealthThreshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={settings.autoHealHealthThreshold}
                onChange={e => handleUpdate({ autoHealHealthThreshold: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Panel 2: Auto-Sync Trigger Customization */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Auto-Sync Trigger Customization</h2>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              settings.autoSyncEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {settings.autoSyncEnabled ? 'AUTO-SYNC ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            Automatically reconciles offline vector buffers with zero data loss. Triggers upon network recovery or when local queue reach customized thresholds.
          </p>

          <div className="space-y-4 p-4 rounded bg-slate-950/80 border border-slate-800">
            {/* Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div>
                <span className="font-semibold text-white block">Enable Autonomous Synchronization</span>
                <span className="text-[10px] text-slate-500">Synchronizes mutations automatically using CRDT vector clocks</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSyncEnabled}
                onChange={e => handleUpdate({ autoSyncEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Sync on Reconnect */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div>
                <span className="font-semibold text-white block">Immediate Sync on Reconnect</span>
                <span className="text-[10px] text-slate-500">Flush all buffered records instantly when connection is restored</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSyncOnReconnect}
                onChange={e => handleUpdate({ autoSyncOnReconnect: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Queue Size Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Buffer Size Flush Trigger:</span>
                <span className="text-cyan-400 font-bold">{settings.autoSyncQueueSizeThreshold} Records</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.autoSyncQueueSizeThreshold}
                onChange={e => handleUpdate({ autoSyncQueueSizeThreshold: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 (Immediate)</span>
                <span>3 (Balanced Batch)</span>
                <span>10 (High Volume)</span>
              </div>
            </div>

            {/* Periodic Interval */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Periodic Auto-Sync Interval:</span>
                <span className="text-emerald-400 font-bold">Every {settings.autoSyncIntervalSec}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.autoSyncIntervalSec}
                onChange={e => handleUpdate({ autoSyncIntervalSec: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Failover & Auto-Rekey Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Auto-Rekey */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Rekeying Trigger</span>
            </span>
            <input
              type="checkbox"
              checked={settings.autoRekeyEnabled}
              onChange={e => handleUpdate({ autoRekeyEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Automatically ratchets to next epoch keypair when UniGas gas balance falls below {settings.autoRekeyThresholdMicroGas.toLocaleString()} μG.
          </p>
        </div>

        {/* Auto-Failover */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Adaptive Multi-Cloud Auto-Failover</span>
            </span>
            <input
              type="checkbox"
              checked={settings.autoFailoverEnabled}
              onChange={e => handleUpdate({ autoFailoverEnabled: e.target.checked })}
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Automatically migrates traffic to warm standby cloud if primary region latency spikes above {settings.autoFailoverLatencyThresholdMs}ms.
          </p>
        </div>
      </div>

      {/* Live Automation Activity Feed */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Live Autonomous Trigger Activity Feed</h3>
          </div>
          <span className="text-[11px] text-slate-400">Autonomous Execution Log</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {events.length > 0 ? (
            events.map(ev => (
              <div
                key={ev.id}
                className="p-3 rounded bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      ev.triggerType === 'AUTO_HEAL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' :
                      ev.triggerType === 'AUTO_SYNC' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      'bg-purple-950 text-purple-300 border border-purple-500/40'
                    }`}>
                      {ev.triggerType}
                    </span>
                    <span className="font-semibold text-white">{ev.title}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{ev.details}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500 self-end sm:self-auto">
                  <span className="text-emerald-400 font-semibold">[{ev.status}]</span>
                  <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">No automation events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

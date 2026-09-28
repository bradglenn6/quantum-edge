import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  Plus, 
  CloudLightning, 
  Server,
  Radio,
  Users
} from 'lucide-react';
import { SyncDisasterService } from '../services/syncDisasterService';
import { SyncRecord, DisasterRecoveryState } from '../types';
import { P2PMeshService, P2PPeerNode } from '../services/p2pMeshService';

interface OfflineSyncDisasterViewProps {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  recoveryState: DisasterRecoveryState;
  onStateUpdated: (state: DisasterRecoveryState) => void;
}

export const OfflineSyncDisasterView: React.FC<OfflineSyncDisasterViewProps> = ({
  isOnline,
  setIsOnline,
  recoveryState,
  onStateUpdated
}) => {
  const service = SyncDisasterService.getInstance();
  const [vaultRecords, setVaultRecords] = useState<SyncRecord[]>(service.getLocalVault());
  const [offlineQueue, setOfflineQueue] = useState<SyncRecord[]>(service.getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // New record form
  const [newTitle, setNewTitle] = useState('Critical Telemetry Snapshot #904');
  const [newCollection, setNewCollection] = useState('MissionData');

  // Disaster recovery
  const [selectedRegion, setSelectedRegion] = useState<DisasterRecoveryState['currentRegion']>(recoveryState.currentRegion);
  const [isFailingOver, setIsFailingOver] = useState(false);
  const [failoverMsg, setFailoverMsg] = useState<string | null>(null);
  const [pitrSliderVal, setPitrSliderVal] = useState<number>(100);

  // P2P WebRTC Mesh State
  const meshService = P2PMeshService.getInstance();
  const [peers, setPeers] = useState<P2PPeerNode[]>(meshService.getPeers());
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [newPeerName, setNewPeerName] = useState('');

  useEffect(() => {
    const unsubPeers = meshService.subscribe(setPeers);
    const unsubLogs = meshService.subscribeLogs(log => {
      setMeshLogs(prev => [log, ...prev].slice(0, 10));
    });
    return () => {
      unsubPeers();
      unsubLogs();
    };
  }, [meshService]);

  const handleAddPeer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeerName.trim()) return;
    meshService.connectManualPeer(newPeerName.trim());
    setNewPeerName('');
  };

  const handleToggleOnline = (status: boolean) => {
    service.setOnlineStatus(status);
    setIsOnline(status);
    onStateUpdated(service.getRecoveryState());
  };

  const handleCreateRecord = async () => {
    if (!newTitle.trim()) return;
    await service.saveRecord(newCollection, {
      title: newTitle,
      quantumKeyRef: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
      createdVia: isOnline ? 'ONLINE_MESH_SYNC' : 'OFFLINE_LOCAL_VAULT_BUFFER',
      dataIntegrityScore: 100
    });

    setVaultRecords([...service.getLocalVault()]);
    setOfflineQueue([...service.getOfflineQueue()]);
    setNewTitle(`Critical Telemetry Snapshot #${Math.floor(Math.random() * 800) + 100}`);
  };

  const handleSyncQueue = async () => {
    if (!isOnline) {
      setSyncFeedback('Cannot synchronize while in simulated offline mode.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await service.syncOfflineQueue();
      setVaultRecords([...service.getLocalVault()]);
      setOfflineQueue([...service.getOfflineQueue()]);
      onStateUpdated(service.getRecoveryState());
      setSyncFeedback(`Successfully synchronized ${res.syncedCount} records. Resolved ${res.resolvedConflicts} vector collisions.`);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePerformFailover = (target: DisasterRecoveryState['currentRegion']) => {
    setIsFailingOver(true);
    setFailoverMsg(null);
    setTimeout(() => {
      const res = service.performFailover(target);
      setSelectedRegion(target);
      onStateUpdated(service.getRecoveryState());
      setIsFailingOver(false);
      setFailoverMsg(`Failover completed in ${res.failoverDurationMs}ms. Active region shifted to ${target.toUpperCase()}.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Offline-First Sync & Robust Disaster Recovery</h1>
            <span className="text-xs font-mono-code text-teal-400">CRDT Vector Clocks · Multi-Cloud Failover</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous data availability during network partitions with deterministic conflict resolution and sub-4s cloud disaster recovery.
          </p>
        </div>

        {/* Network Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleOnline(!isOnline)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono-code transition-colors border ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-purple-300" />}
            <span>{isOnline ? 'Online (Connected)' : 'Simulate Offline Airgap'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div className="p-3 rounded bg-teal-950/40 border border-teal-500/40 text-xs font-mono-code text-teal-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Grid: Offline Sync Lab & Disaster Recovery Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Offline-First Synchronization & CRDT Buffer */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Offline-First CRDT Local Vault</h2>
            </div>
            <span className="text-xs font-mono-code text-slate-400">
              Offline Queue: <strong className={offlineQueue.length > 0 ? 'text-amber-400' : 'text-slate-500'}>{offlineQueue.length}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Mutations execute immediately in the local vault with monotonic vector clocks. Upon reconnection, offline deltas reconcile without central database locks.
          </p>

          {/* New Record Generator */}
          <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800 space-y-3 font-mono-code text-xs">
            <div className="font-semibold text-slate-200">Emit New CRDT Mutation</div>
            <div className="space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Dataset Title / Telemetry Tag"
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
              <select
                value={newCollection}
                onChange={e => setNewCollection(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="MissionData">MissionData</option>
                <option value="CryptographicVault">CryptographicVault</option>
                <option value="UserProfiles">UserProfiles</option>
                <option value="SensorFeeds">SensorFeeds</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreateRecord}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save to Vault</span>
              </button>

              <button
                onClick={handleSyncQueue}
                disabled={offlineQueue.length === 0 || isSyncing}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Offline Queue ({offlineQueue.length})</span>
              </button>
            </div>
          </div>

          {/* Local Vault Records Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 font-mono-code">Local Vault Records:</div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {vaultRecords.map(rec => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono-code"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{(rec.data as any).title || rec.id}</span>
                      <span className="text-[10px] text-teal-400">[{rec.collection}]</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Vector Clock: {JSON.stringify(rec.vectorClock)} · v{rec.version}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      rec.syncedToCloud 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30' 
                        : 'bg-amber-950 text-amber-300 border border-amber-600/30'
                    }`}>
                      {rec.syncedToCloud ? 'CLOUD SYNCED' : 'OFFLINE BUFFER'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Robust Disaster Recovery (DR) & Failover */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Multi-Cloud Disaster Recovery Control</h2>
            </div>
            <span className="text-xs font-mono-code text-cyan-400">RTO: 3.4s · RPO: 0.8s</span>
          </div>

          <p className="text-xs text-slate-400">
            Seamless multi-region failover across cloud providers to prevent downtime. Point-In-Time-Recovery (PITR) enables instantaneous data rollback.
          </p>

          {/* Failover Toast */}
          {failoverMsg && (
            <div className="p-3 rounded bg-cyan-950/50 border border-cyan-500/50 text-xs font-mono-code text-cyan-300">
              {failoverMsg}
            </div>
          )}

          {/* Multi-Cloud Region Selector */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 font-mono-code">Select Target Failover Cloud:</div>
            <div className="grid grid-cols-2 gap-2 font-mono-code text-xs">
              {[
                { id: 'aws-us-east-1', name: 'AWS us-east-1', role: 'Primary Hot' },
                { id: 'gcp-europe-west1', name: 'GCP europe-west1', role: 'Secondary Warm' },
                { id: 'azure-eastus', name: 'Azure East US', role: 'Standby Failover' },
                { id: 'airgap-onprem-vault', name: 'On-Premises Airgap', role: 'Isolated Vault' }
              ].map(reg => (
                <button
                  key={reg.id}
                  onClick={() => handlePerformFailover(reg.id as any)}
                  disabled={selectedRegion === reg.id || isFailingOver}
                  className={`p-2.5 rounded border text-left transition-colors flex flex-col justify-between ${
                    selectedRegion === reg.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span>{reg.name}</span>
                    {selectedRegion === reg.id && <Server className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{reg.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Snapshots & PITR Rollback */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Point-in-Time Recovery (PITR) Rollback:</span>
              </span>
              <span className="text-cyan-400 font-semibold">{pitrSliderVal}% Epoch</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={pitrSliderVal}
              onChange={e => setPitrSliderVal(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
              <span>T-100 min (Epoch 40)</span>
              <span>T-50 min (Epoch 41)</span>
              <span className="text-cyan-400 font-semibold">Live (Epoch 42)</span>
            </div>

            <button
              onClick={() => {
                const targetTs = Date.now() - (100 - pitrSliderVal) * 60000;
                service.restoreToPointInTime(targetTs);
                setFailoverMsg(`Restored state to snapshot epoch (${pitrSliderVal === 100 ? 'Live' : `T-${100 - pitrSliderVal}m`}).`);
              }}
              className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-mono-code text-xs mt-1"
            >
              Rollback to Selected Snapshot
            </button>
          </div>
        </div>
      </div>

      {/* WebRTC P2P Mesh DataChannel Status */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4 font-mono-code text-xs mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">WebRTC P2P Mesh DataChannel Transport</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            {peers.filter(p => p.connectionState === 'CONNECTED').length} Active Mesh Peers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {peers.map(p => (
            <div key={p.peerId} className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>{p.label}</span>
                <span className="text-[10px] text-emerald-400">{p.latencyMs} ms</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Transport: {p.transportType}</span>
                <span>Synced Records: {p.syncedRecordsCount}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddPeer} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newPeerName}
            onChange={e => setNewPeerName(e.target.value)}
            placeholder="Add peer (e.g. Raspberry Pi Telemetry Node #1)..."
            className="flex-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connect Peer</span>
          </button>
        </form>

        {meshLogs.length > 0 && (
          <div className="p-2.5 rounded bg-black/60 border border-slate-900 space-y-1 text-[10px] text-slate-400">
            {meshLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
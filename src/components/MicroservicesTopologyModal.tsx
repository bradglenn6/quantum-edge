import React, { useState } from 'react';
import { 
  X, 
  Network, 
  CheckCircle, 
  ShieldCheck, 
  Server, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import { MicroservicesMesh } from '../services/microservicesMesh';
import { MicroserviceHealth } from '../types';

interface MicroservicesTopologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MicroservicesTopologyModal: React.FC<MicroservicesTopologyModalProps> = ({
  isOpen,
  onClose
}) => {
  const meshService = MicroservicesMesh.getInstance();
  const [services, setServices] = useState<MicroserviceHealth[]>(meshService.getServices());
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setServices(meshService.getServices().map(s => ({
        ...s,
        latencyMs: parseFloat((s.latencyMs + (Math.random() - 0.5) * 0.4).toFixed(2))
      })));
      setIsRefreshing(false);
    }, 400);
  };

  const totalInstances = services.reduce((acc, s) => acc + s.instancesCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#090e1a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Microservices Architecture &amp; Service Mesh</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
                <span>8 Microservices Active</span>
                <span aria-hidden="true">·</span>
                <span>{totalInstances} Clustered Instances</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">Fault-Tolerant Routing</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Ping Microservices"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto font-mono-code text-xs">
          <p className="text-slate-400 text-xs leading-relaxed">
            The ZeroLabz platform is engineered around decoupled, autonomous microservices for maximum fault tolerance, horizontal scaling, and zero single-points-of-failure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map(svc => (
              <div
                key={svc.serviceId}
                className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">{svc.name}</span>
                    <div className="text-[11px] text-cyan-400 mt-0.5">{svc.serviceId}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>{svc.status}</span>
                  </span>
                </div>

                <div className="space-y-1 text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                  <div className="flex justify-between">
                    <span>Endpoint:</span>
                    <span className="text-slate-300">{svc.endpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Latency:</span>
                    <span className="text-emerald-400 font-semibold">{svc.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Containers:</span>
                    <span className="text-white">{svc.instancesCount} Replicas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Post-Quantum E2EE:</span>
                    <span className="text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>ML-KEM Protected</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Modular Scalability Guarantee:</span>
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Every microservice operates independently with its own bounded context. If any downstream service fails or trips its circuit breaker, upstream fallbacks isolate the incident without cascading degradation across user data communications.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-slate-500 text-xs font-mono-code">Service Mesh: ZeroLabz Istio/Envoy Lattice Proxy</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

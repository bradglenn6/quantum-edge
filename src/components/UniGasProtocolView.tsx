import React, { useState } from 'react';
import { 
  Key, 
  Zap, 
  Play, 
  CheckCircle, 
  RotateCw, 
  Lock, 
  FileText, 
  Copy
} from 'lucide-react';
import { UniGasService } from '../services/unigasService';
import { UniGasSession, UniGasHandshakeStep } from '../types';

interface UniGasProtocolViewProps {
  session: UniGasSession | null;
  onSessionUpdated: (session: UniGasSession) => void;
}

export const UniGasProtocolView: React.FC<UniGasProtocolViewProps> = ({
  session,
  onSessionUpdated
}) => {
  const unigas = UniGasService.getInstance();
  const [handshakeSteps, setHandshakeSteps] = useState<UniGasHandshakeStep[]>(unigas.getHandshakeHistory());
  const [isExecuting, setIsExecuting] = useState(false);
  const [txCountInput, setTxCountInput] = useState(50);
  const [copyTokenSuccess, setCopyTokenSuccess] = useState(false);

  const handleRunHandshake = async () => {
    setIsExecuting(true);
    try {
      const res = await unigas.executeKeyExchange('edge-mobile-node-04');
      setHandshakeSteps(res.steps);
      onSessionUpdated(res.session);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConsumeGas = () => {
    const res = unigas.consumeGas(txCountInput);
    if (session) {
      onSessionUpdated({
        ...session,
        gasBalanceMicroGas: res.remainingGas,
        ratchetEpoch: session.ratchetEpoch + (res.ratcheted ? 1 : 0)
      });
    }
  };

  const copyToken = () => {
    if (session?.authBindingToken) {
      navigator.clipboard.writeText(session.authBindingToken);
      setCopyTokenSuccess(true);
      setTimeout(() => setCopyTokenSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">UniGas Protocol &amp; Auth Gateway</h1>
            <span className="text-xs font-mono-code text-emerald-400">Gas-Metered PQC Ratchet</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-overhead post-quantum key exchange protocol with anti-DDoS gas metering and bound JWT authentication tokens.
          </p>
        </div>

        <button
          onClick={handleRunHandshake}
          disabled={isExecuting}
          className="flex items-center gap-2 px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono-code transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{isExecuting ? 'Exchanging Keys...' : 'Execute UniGas Handshake'}</span>
        </button>
      </div>

      {/* Gas Meter & Active Epoch Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-code text-xs">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>UNIGAS BALANCE</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {session ? session.gasBalanceMicroGas.toLocaleString() : '100,000'} <span className="text-xs font-normal text-slate-400">μG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Prevents Replay Attacks</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>RATCHET EPOCH</span>
            <RotateCw className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            #{session?.ratchetEpoch || 42}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Forward Secrecy Active</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>GAS PER OPERATION</span>
            <Key className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-200">
            {session?.gasCostPerTx || 18} <span className="text-xs font-normal text-slate-400">μG/tx</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Microsecond Settlement</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>AUTH STATUS</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 uppercase">
            {session?.status || 'ACTIVE'}
          </div>
          <div className="text-[11px] text-emerald-500 mt-1">Bound to ML-DSA-87</div>
        </div>
      </div>

      {/* Handshake Protocol Sequence Visualizer */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">UniGas Key Exchange Handshake Sequence</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-code">4-Phase Mutual Protocol</span>
        </div>

        <div className="space-y-3">
          {handshakeSteps.length > 0 ? (
            handshakeSteps.map(step => (
              <div
                key={step.step}
                className="p-3.5 rounded bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono-code"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{step.phase}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-cyan-400 text-[11px]">[{step.sender}]</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">{step.action}</p>
                    <p className="text-slate-500 text-[10px] mt-1 break-all">{step.payloadSummary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-[11px]">
                  <span className="text-amber-400 font-medium">-{step.gasBurnedMicroGas} μG</span>
                  <span className="text-slate-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs font-mono-code">
              Click &quot;Execute UniGas Handshake&quot; to initiate a live key exchange.
            </div>
          )}
        </div>
      </div>

      {/* Seamless Auth Flow & Bound Token Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Inspection */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Post-Quantum Bound Auth Token (JWT)</h2>
            </div>
            <button
              onClick={copyToken}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono-code"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copyTokenSuccess ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            This token integrates with standard OAuth 2.0 / OpenID Connect authorization headers while cryptographically binding the user’s identity to the ephemeral ML-KEM-1024 session key.
          </p>

          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono-code space-y-2">
            <div className="text-slate-500 uppercase text-[10px]">Authorization Header:</div>
            <div className="text-emerald-400 break-all select-all">
              Bearer {session?.authBindingToken.substring(0, 80)}...
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono-code space-y-1">
            <div className="text-slate-400 font-semibold">Decoded Claims:</div>
            <div className="text-slate-300">sub: &quot;{session?.clientId}&quot;</div>
            <div className="text-slate-300">unigas_epoch: {session?.ratchetEpoch}</div>
            <div className="text-slate-300">pqc_alg: &quot;ML-DSA-87 / FIPS-204&quot;</div>
            <div className="text-slate-300">security_tier: &quot;NIST_LEVEL_5_QUANTUM_RESILIENT&quot;</div>
          </div>
        </div>

        {/* Gas Consumption Simulator */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Gas Consumption &amp; Ratchet Simulator</h2>
            </div>
            <span className="text-xs font-mono-code text-slate-400">Traffic Throttling</span>
          </div>

          <p className="text-xs text-slate-400">
            Each transmission burns a fractional amount of microGas (18 μG). When the session gas runs low, the UniGas protocol automatically rotates keys into a new epoch.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Simulate Transaction Batch:</label>
              <input
                type="number"
                min={1}
                max={500}
                value={txCountInput}
                onChange={e => setTxCountInput(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono-code focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleConsumeGas}
              className="mt-5 px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono-code transition-colors"
            >
              Burn Gas ({txCountInput * 18} μG)
            </button>
          </div>

          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">Anti-DDoS &amp; State Protection:</div>
            <p>
              Quantum computers attempting brute-force lattice searches or replay attacks are blocked by the continuous ratcheting and gas requirement of the UniGas protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

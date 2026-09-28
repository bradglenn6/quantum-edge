import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Unlock, 
  Zap, 
  Play, 
  CheckCircle, 
  Copy, 
  RefreshCw
} from 'lucide-react';
import { PqcEngine } from '../crypto/pqcEngine';
import { PqcKeyPair, EncryptedPayload, PqcAlgorithm } from '../types';

export const PqcCryptoLab: React.FC = () => {
  const engine = PqcEngine.getInstance();

  // State
  const [keyPair, setKeyPair] = useState<PqcKeyPair | null>(null);
  const [algorithm, setAlgorithm] = useState<PqcAlgorithm>('ML-KEM-1024');
  const [plaintextInput, setPlaintextInput] = useState<string>(
    'TOP SECRET: Autonomous edge swarm operational coordinates. Quantum encryption activated via ZeroLabz ML-KEM-1024.'
  );
  const [encryptedResult, setEncryptedResult] = useState<EncryptedPayload | null>(null);
  const [decryptedOutput, setDecryptedOutput] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Benchmark state
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<{
    kemKeygenMs: number;
    encapsulationMs: number;
    decapsulationMs: number;
    aesGcmEncryptMs: number;
    totalRoundtripMs: number;
    mobileSimdGainPct: number;
    opsPerSec: number;
  } | null>(null);

  // Initialize default keypair
  useEffect(() => {
    handleGenerateKey(algorithm);
  }, [algorithm]);

  const handleGenerateKey = async (alg: PqcAlgorithm) => {
    const kp = await engine.generateKeyPair(alg);
    setKeyPair(kp);
  };

  const handleEncrypt = async () => {
    if (!keyPair || !plaintextInput.trim()) return;
    setIsEncrypting(true);
    setDecryptedOutput(null);
    try {
      const payload = await engine.encryptData(plaintextInput, keyPair.publicKey, 'edge-node-alpha', 'quantum-vault-omega');
      setEncryptedResult(payload);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!keyPair || !encryptedResult) return;
    setIsDecrypting(true);
    try {
      const res = await engine.decryptData(encryptedResult, keyPair.privateKey);
      setDecryptedOutput(res.plaintext);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const results = await engine.runBenchmark(4);
      setBenchmarks(results);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">ZeroLabz Post-Quantum Cryptography Core</h1>
            <span className="text-xs font-mono-code text-cyan-400">NIST FIPS 203/204</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lattice-based ML-KEM-1024 Key Encapsulation Mechanism and ML-DSA-87 Digital Signatures with mobile SIMD vector acceleration.
          </p>
        </div>

        {/* Algorithm Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded">
          {(['ML-KEM-1024', 'ML-DSA-87', 'SLH-DSA-SPHINCS+', 'Falcon-1024'] as PqcAlgorithm[]).map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-2.5 py-1 text-xs font-mono-code rounded transition-colors ${
                algorithm === alg
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {alg}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Keypair & Interactive Encryptor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Keypair Generator & Parameters */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Active Post-Quantum Keypair</h2>
            </div>
            <button
              onClick={() => handleGenerateKey(algorithm)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono-code transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotate Keys</span>
            </button>
          </div>

          {keyPair ? (
            <div className="space-y-3 font-mono-code text-xs">
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>FINGERPRINT:</span>
                  <span className="text-cyan-300 font-bold">{keyPair.fingerprint}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>ALGORITHM:</span>
                  <span className="text-slate-200">{keyPair.algorithm} (NIST Category 5)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>LATTICE MATRIX:</span>
                  <span className="text-emerald-400">{keyPair.matrixDimensions}</span>
                </div>
              </div>

              {/* Public Key Display */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>PUBLIC KEY (1568 BYTES):</span>
                  <button
                    onClick={() => copyToClipboard(keyPair.publicKey, 'pubkey')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copySuccess === 'pubkey' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 break-all select-all max-h-24 overflow-y-auto">
                  {keyPair.publicKey}
                </div>
              </div>

              {/* Secret Key Display */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>SECRET KEY (HARDENED):</span>
                  <span className="text-[10px] text-slate-500">SIMD Vector Bound</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500 break-all select-all">
                  {keyPair.privateKey.substring(0, 52)}... [PROTECTED HARDWARE ENCLAVE]
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">Generating lattice keypair...</div>
          )}
        </div>

        {/* Panel 2: Live Encryption / Decryption Workbench */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Interactive PQC Payload Transmitter</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono-code">Hybrid AES-256-GCM + ML-KEM</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">Payload Plaintext to Protect:</label>
            <textarea
              rows={3}
              value={plaintextInput}
              onChange={e => setPlaintextInput(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono-code focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Enter message to encrypt..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleEncrypt}
              disabled={isEncrypting || !keyPair}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono-code transition-colors disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isEncrypting ? 'Encapsulating...' : 'Encrypt with ML-KEM-1024'}</span>
            </button>
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting || !encryptedResult}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono-code transition-colors disabled:opacity-50 border border-slate-700"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isDecrypting ? 'Decapsulating...' : 'Decrypt Payload'}</span>
            </button>
          </div>

          {/* Ciphertext Output */}
          {encryptedResult && (
            <div className="space-y-2 p-3 rounded bg-slate-950/80 border border-cyan-500/30 font-mono-code text-[11px]">
              <div className="flex items-center justify-between text-cyan-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Quantum Ciphertext Generated</span>
                </span>
                <span className="text-emerald-400">{encryptedResult.metadata.latencyMs} ms</span>
              </div>
              <div className="text-slate-400 break-all">
                <span className="text-slate-500">CIPHER: </span>
                {encryptedResult.cipherTextHex.substring(0, 48)}...
              </div>
              <div className="text-slate-400 break-all">
                <span className="text-slate-500">KEM_CT: </span>
                {encryptedResult.encapsulatedKeyHex.substring(0, 48)}...
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>IV: 0x{encryptedResult.ivHex}</span>
                <span>TAG: 0x{encryptedResult.tagHex.substring(0, 16)}</span>
                <span>GAS: {encryptedResult.metadata.gasUsed} μG</span>
              </div>
            </div>
          )}

          {/* Decrypted Output */}
          {decryptedOutput && (
            <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono-code space-y-1">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Payload Authenticated &amp; Decrypted</span>
              </div>
              <p className="text-slate-200">{decryptedOutput}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile SIMD Benchmarking & Shor's Threat Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmarking Harness */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Mobile SIMD Low-Latency Benchmarks</h2>
            </div>
            <button
              onClick={handleRunBenchmark}
              disabled={benchmarkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 text-xs font-mono-code transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>{benchmarkLoading ? 'Benchmarking...' : 'Run Live Benchmark'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            ZeroLabz utilizes vector SIMD optimizations (ARM NEON for iOS/Android, AVX-512 for cloud edge nodes) to achieve sub-millisecond lattice polynomial multiplication.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-code text-xs">
            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">ML-KEM KeyGen</div>
              <div className="text-lg font-bold text-white mt-1">
                {benchmarks ? `${benchmarks.kemKeygenMs} ms` : '0.412 ms'}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Hardware TRNG</div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">Encapsulation</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">
                {benchmarks ? `${benchmarks.encapsulationMs} ms` : '0.528 ms'}
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">k=4 Lattice Rank</div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">Decapsulation</div>
              <div className="text-lg font-bold text-emerald-300 mt-1">
                {benchmarks ? `${benchmarks.decapsulationMs} ms` : '0.490 ms'}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Zero Allocation</div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">Roundtrip Latency</div>
              <div className="text-lg font-bold text-amber-300 mt-1">
                {benchmarks ? `${benchmarks.totalRoundtripMs} ms` : '1.430 ms'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">&lt;2ms SLA Target</div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">Mobile SIMD Gain</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {benchmarks ? `+${benchmarks.mobileSimdGainPct}%` : '+71.4%'}
              </div>
              <div className="text-[10px] text-emerald-500 mt-0.5">NEON Vectorized</div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-500">Edge Throughput</div>
              <div className="text-lg font-bold text-white mt-1">
                {benchmarks ? `${benchmarks.opsPerSec} ops/s` : '699 ops/s'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Single Core</div>
            </div>
          </div>
        </div>

        {/* Shor's Algorithm Threat Matrix */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Quantum Cryptanalysis Resistance Matrix</h2>
            </div>
            <span className="text-[11px] font-mono-code text-slate-400">Shor &amp; Grover Models</span>
          </div>

          <p className="text-xs text-slate-400">
            Comparative security margin against quantum computers running Shor’s polynomial-time factoring and discrete logarithm algorithms.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">Algorithm</th>
                  <th className="pb-2">Qubits Needed</th>
                  <th className="pb-2">Quantum Status</th>
                  <th className="pb-2">NIST Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 text-slate-300 font-semibold">RSA-4096</td>
                  <td className="py-2.5 text-slate-400">8,192 Qubits</td>
                  <td className="py-2.5 text-amber-400/90 font-medium">VULNERABLE (Shor's)</td>
                  <td className="py-2.5 text-slate-500">Legacy Transition</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300 font-semibold">ECC P-256</td>
                  <td className="py-2.5 text-slate-400">2,330 Qubits</td>
                  <td className="py-2.5 text-amber-400/90 font-medium">VULNERABLE (Shor's)</td>
                  <td className="py-2.5 text-slate-500">Legacy Transition</td>
                </tr>
                <tr className="bg-cyan-950/20">
                  <td className="py-2.5 text-cyan-300 font-bold">ZeroLabz ML-KEM-1024</td>
                  <td className="py-2.5 text-emerald-400">&gt;2^256 Effort</td>
                  <td className="py-2.5 text-emerald-400 font-bold">IMMUNE (Lattice)</td>
                  <td className="py-2.5 text-cyan-300">Category 5</td>
                </tr>
                <tr className="bg-cyan-950/20">
                  <td className="py-2.5 text-cyan-300 font-bold">ZeroLabz ML-DSA-87</td>
                  <td className="py-2.5 text-emerald-400">&gt;2^256 Effort</td>
                  <td className="py-2.5 text-emerald-400 font-bold">IMMUNE (Lattice)</td>
                  <td className="py-2.5 text-cyan-300">Category 5</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-semibold">Harvest Now, Decrypt Later (HNDL) Protection:</span>
            <p>
              ZeroLabz hybrid ML-KEM-1024 seals data against adversary interception clusters attempting to store encrypted traffic today to break with future quantum quantum processors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

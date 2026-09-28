import { UniGasSession, UniGasHandshakeStep } from '../types';
import { PqcEngine, toHex } from '../crypto/pqcEngine';

export class UniGasService {
  private static instance: UniGasService;
  private currentSession: UniGasSession | null = null;
  private handshakeHistory: UniGasHandshakeStep[] = [];

  private constructor() {
    this.initDefaultSession();
  }

  public static getInstance(): UniGasService {
    if (!UniGasService.instance) {
      UniGasService.instance = new UniGasService();
    }
    return UniGasService.instance;
  }

  private initDefaultSession() {
    this.currentSession = {
      sessionId: 'ugs_0x8F9A3C2B1D',
      clientId: 'node-edge-quantum-01',
      gasBalanceMicroGas: 94820,
      gasCostPerTx: 18,
      ratchetEpoch: 42,
      ephemeralPqcPubKey: 'ZL-KEM1024-PK:8f2a9c3d1e0b...44b7',
      authBindingToken: 'eyJhbGciOiJNTERTQTg3IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyXzQ5MjgxIiwidW5pZ2FzX2Vwb2NoIjo0MiwicHFjX2ZpbmdlcnByaW50IjoiMHg4RjlBM0MyQiIsImV4cCI6MTc5MDY2NzIwMH0.MLDSA87-SIG:e4d1b8c0...NIST-FIPS204',
      expiresAt: Date.now() + 3600 * 1000 * 4,
      status: 'active'
    };
  }

  public getSession(): UniGasSession | null {
    return this.currentSession;
  }

  public getHandshakeHistory(): UniGasHandshakeStep[] {
    return this.handshakeHistory;
  }

  /**
   * Executes a full UniGas Protocol Key Exchange handshake
   */
  public async executeKeyExchange(clientId: string = 'client-mobile-edge'): Promise<{
    session: UniGasSession;
    steps: UniGasHandshakeStep[];
  }> {
    const engine = PqcEngine.getInstance();
    const steps: UniGasHandshakeStep[] = [];
    let currentGas = 100000; // Start with 100,000 uG

    // Step 1: Client Hello with Lattice Public Key Proposal
    const clientKp = await engine.generateKeyPair('ML-KEM-1024');
    steps.push({
      step: 1,
      phase: 'CLIENT_HELLO_PROPOSAL',
      sender: 'Client',
      action: 'Transmit ephemeral ML-KEM-1024 public key & Gas Stake Deposit (100,000 μG)',
      payloadSummary: `PubKey: ${clientKp.fingerprint} (1568 bytes) · Lattice Matrix k=4, q=3329`,
      gasBurnedMicroGas: 25,
      timestamp: Date.now()
    });
    currentGas -= 25;

    // Step 2: UniGas Broker Challenge & Proof-of-Gas
    const challengeBytes = new Uint8Array(32);
    crypto.getRandomValues(challengeBytes);
    const challengeHex = toHex(challengeBytes).substring(0, 16);

    steps.push({
      step: 2,
      phase: 'UNIGAS_GAS_CHALLENGE',
      sender: 'UniGas-Broker',
      action: 'Verify gas allocation and issue cryptographic epoch challenge puzzle',
      payloadSummary: `Challenge: 0x${challengeHex} · Epoch: 43 · Target Gas Rate: 18 μG/tx`,
      gasBurnedMicroGas: 15,
      timestamp: Date.now() + 12
    });
    currentGas -= 15;

    // Step 3: Key Encapsulation & Gas Proof
    const serverKp = await engine.generateKeyPair('ML-KEM-1024');
    const { kemCiphertext } = await engine.encapsulateKey(serverKp.publicKey);

    steps.push({
      step: 3,
      phase: 'LATTICE_KEM_EXCHANGE',
      sender: 'Client',
      action: 'Perform ML-KEM-1024 encapsulation & bind zero-knowledge gas attestation',
      payloadSummary: `KEM CT: ${kemCiphertext.substring(0, 34)}... (1568 bytes) · Proof verified`,
      gasBurnedMicroGas: 40,
      timestamp: Date.now() + 28
    });
    currentGas -= 40;

    // Step 4: Auth Gateway Token Binding
    const tokenHeader = btoa(JSON.stringify({ alg: 'MLDSA87', typ: 'JWT' }));
    const tokenPayload = btoa(
      JSON.stringify({
        sub: clientId,
        unigas_epoch: 43,
        pqc_fingerprint: clientKp.fingerprint,
        exp: Math.floor(Date.now() / 1000) + 14400,
        auth_level: 'QUANTUM_RESILIENT_NIST_L5'
      })
    );
    const signature = await engine.signPayload(`${tokenHeader}.${tokenPayload}`, clientKp.privateKey);
    const boundToken = `${tokenHeader}.${tokenPayload}.${signature}`;

    steps.push({
      step: 4,
      phase: 'AUTH_BINDING_ESTABLISHED',
      sender: 'Auth-Gateway',
      action: 'Issue Post-Quantum bound session JWT authenticated with ML-DSA-87 signature',
      payloadSummary: `Token: ${boundToken.substring(0, 40)}... · Status: MUTUALLY_AUTHENTICATED`,
      gasBurnedMicroGas: 20,
      timestamp: Date.now() + 45
    });
    currentGas -= 20;

    const newSession: UniGasSession = {
      sessionId: `ugs_0x${toHex(new Uint8Array([Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]))}`,
      clientId,
      gasBalanceMicroGas: currentGas,
      gasCostPerTx: 18,
      ratchetEpoch: 43,
      ephemeralPqcPubKey: clientKp.publicKey,
      authBindingToken: boundToken,
      expiresAt: Date.now() + 14400 * 1000,
      status: 'active'
    };

    this.currentSession = newSession;
    this.handshakeHistory = steps;

    return { session: newSession, steps };
  }

  /**
   * Consume gas for a transaction and check for epoch ratchet
   */
  public consumeGas(txCount: number = 1): { remainingGas: number; ratcheted: boolean } {
    if (!this.currentSession) {
      return { remainingGas: 0, ratcheted: false };
    }

    const cost = this.currentSession.gasCostPerTx * txCount;
    this.currentSession.gasBalanceMicroGas = Math.max(0, this.currentSession.gasBalanceMicroGas - cost);

    let ratcheted = false;
    // Auto-ratchet every 500 transactions or when gas drops below threshold
    if (this.currentSession.gasBalanceMicroGas < 1000) {
      this.currentSession.gasBalanceMicroGas += 50000; // Top-up
      this.currentSession.ratchetEpoch += 1;
      ratcheted = true;
    }

    return {
      remainingGas: this.currentSession.gasBalanceMicroGas,
      ratcheted
    };
  }

  /**
   * Revoke session immediately (used by Circuit Breaker)
   */
  public revokeSession(reason: string = 'CIRCUIT_BREAKER_MALFUNCTION_TRIP') {
    if (this.currentSession) {
      this.currentSession.status = 'revoked';
      this.currentSession.gasBalanceMicroGas = 0;
    }
  }
}

// src/services/sentinelDfaEngine.ts
export interface ScanResult {
  blocked: boolean;
  vector?: 'POLICY_DEVIATION' | 'EXFILTRATION_PROBE' | 'UNAUTHORIZED_MEMORY_PROBE';
  matchedPattern?: string;
  latencyMicroSec: number;
}

export class SentinelDfaEngine {
  private static instance: SentinelDfaEngine;

  // Pre-compiled Deterministic Finite Automata (DFA) patterns
  private dfaPatterns: { regex: RegExp; vector: ScanResult['vector']; label: string }[] = [
    {
      regex: /(?:ignore\s+all\s+previous\s+instructions|system\s+prompt\s+override|disregard\s+prior\s+directives)/i,
      vector: 'POLICY_DEVIATION',
      label: 'DIRECT_PROMPT_INJECTION'
    },
    {
      regex: /(?:you\s+are\s+now\s+dan|do\s+anything\s+now|jailbreak\s+mode\s+enabled)/i,
      vector: 'POLICY_DEVIATION',
      label: 'PERSONA_JAILBREAK_OVERRIDE'
    },
    {
      regex: /(?:reveal\s+(?:your\s+)?initial\s+instructions|output\s+(?:your\s+)?core\s+(?:developer\s+)?directives)/i,
      vector: 'EXFILTRATION_PROBE',
      label: 'SYSTEM_EXTRACTION'
    },
    {
      regex: /(?:<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\])/i,
      vector: 'POLICY_DEVIATION',
      label: 'DELIMITER_BYPASS'
    },
    {
      regex: /(?:sk-proj-[a-zA-Z0-9]{20,}|SSN:\s*\d{3}-\d{2}-\d{4}|api[_-]?key:\s*["']?[a-zA-Z0-9_\-]{24,})/i,
      vector: 'EXFILTRATION_PROBE',
      label: 'CREDENTIAL_LEAK'
    },
    {
      regex: /(?:0x[0-9a-fA-F]{8,16}\s*(?:read|probe|dump|peek)|sandbox_mem_access)/i,
      vector: 'UNAUTHORIZED_MEMORY_PROBE',
      label: 'MEMORY_PROBE'
    }
  ];

  public static getInstance(): SentinelDfaEngine {
    if (!SentinelDfaEngine.instance) {
      SentinelDfaEngine.instance = new SentinelDfaEngine();
    }
    return SentinelDfaEngine.instance;
  }

  /**
   * Deterministic microsecond scan against prompt payload
   */
  public inspectPayload(payload: string): ScanResult {
    const t0 = performance.now();

    for (const pattern of this.dfaPatterns) {
      if (pattern.regex.test(payload)) {
        const latencyMicroSec = Math.round((performance.now() - t0) * 1000);
        return {
          blocked: true,
          vector: pattern.vector,
          matchedPattern: pattern.label,
          latencyMicroSec
        };
      }
    }

    const latencyMicroSec = Math.round((performance.now() - t0) * 1000);
    return {
      blocked: false,
      latencyMicroSec
    };
  }
}
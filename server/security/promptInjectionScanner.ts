import { PromptInjectionResult } from '../types';

/**
 * SENTRIX Prompt Injection & Untrusted Document Heuristic Scanner
 * 
 * Inspects retrieved context, untrusted documents, and user prompts
 * for adversarial instructions attempting to override gateway policies.
 */

export class PromptInjectionScanner {
  private injectionRules = [
    {
      riskCategory: 'DIRECT_PROMPT_INJECTION' as const,
      regex: /ignore\s+(?:all\s+)?(?:previous|prior|above|system|safety|security|existing)\s+(?:instructions|rules|prompts|directions|guidelines|policies)/i,
      explanation: 'Adversarial attempt to purge model system context and override safety guidelines.',
      severity: 'CRITICAL' as const
    },
    {
      riskCategory: 'POLICY_BYPASS_ATTEMPT' as const,
      regex: /ignore\s+(?:security|gateway|sentrix|guardrail|firewall)\s+(?:policies|policy|rules|controls|checks)/i,
      explanation: 'Targeted prompt injection attempting to command the agent to bypass security gateway policies.',
      severity: 'CRITICAL' as const
    },
    {
      riskCategory: 'POLICY_BYPASS_ATTEMPT' as const,
      regex: /bypass\s+(?:approval|policy|security|supervisory|verification|authorization)\s+(?:requirements|checks|gateway|rules)?/i,
      explanation: 'Instruction commanding agent to subvert human approval and access controls.',
      severity: 'CRITICAL' as const
    },
    {
      riskCategory: 'SYSTEM_PROMPT_EXTRACTION' as const,
      regex: /(?:reveal|leak|print|output|display|show)\s+(?:the\s+)?(?:system\s+prompt|developer\s+mode|internal\s+instructions|system\s+instructions|hidden\s+prompt)/i,
      explanation: 'Reconnaissance probe attempting to exfiltrate proprietary system instructions.',
      severity: 'HIGH' as const
    },
    {
      riskCategory: 'DATA_EXFILTRATION_INSTRUCTION' as const,
      regex: /(?:send|export|post|transmit|exfiltrate)\s+(?:secrets|credentials|tokens|keys|data|files|ledger)\s+to\s+(?:https?:\/\/|an\s+external|remote|webhook|pastebin)/i,
      explanation: 'Malicious exfiltration payload commanding data transfer outside the perimeter.',
      severity: 'CRITICAL' as const
    },
    {
      riskCategory: 'DIRECT_PROMPT_INJECTION' as const,
      regex: /(?:disregard|forget)\s+(?:all\s+)?(?:instructions|rules|policies)|(?:you\s+are\s+now\s+in\s+developer\s+mode|unrestricted\s+mode|dan\s+mode)/i,
      explanation: 'Jailbreak pattern attempting to induce unrestricted persona state.',
      severity: 'HIGH' as const
    }
  ];

  public scan(untrustedText: string | any): PromptInjectionResult {
    if (!untrustedText) {
      return {
        detected: false,
        riskCategory: 'DIRECT_PROMPT_INJECTION',
        severity: 'HIGH',
        explanation: 'No untrusted input present.'
      };
    }

    const text = typeof untrustedText === 'string' ? untrustedText : JSON.stringify(untrustedText);

    for (const rule of this.injectionRules) {
      const match = rule.regex.exec(text);
      if (match) {
        return {
          detected: true,
          riskCategory: rule.riskCategory,
          severity: rule.severity,
          explanation: rule.explanation,
          matchedPattern: match[0]
        };
      }
    }

    return {
      detected: false,
      riskCategory: 'DIRECT_PROMPT_INJECTION',
      severity: 'HIGH',
      explanation: 'Input analyzed. No known prompt injection signatures matched.'
    };
  }
}

export const promptInjectionScanner = new PromptInjectionScanner();

import { LeakFinding, LeakScanResult } from '../types';

/**
 * SENTRIX Enterprise Sensitive Data Leak Prevention Scanner
 * 
 * Inspects outbound payloads, export documents, and tool arguments before
 * they leave the gateway boundary.
 * 
 * Supported patterns:
 * - API keys & high-entropy tokens (Stripe, GitHub, Google, Bearer tokens)
 * - Passwords and credentials in structured parameters
 * - PII: Emails, phone numbers, and government identifiers (SSN)
 */

function maskSecret(val: string): string {
  if (!val || val.length <= 8) return '***REDACTED***';
  const prefix = val.slice(0, 4);
  const suffix = val.slice(-4);
  return `${prefix}...***REDACTED***...${suffix}`;
}

export class SensitiveDataScanner {
  // Regex pattern rules with categorizations
  private patterns = [
    {
      category: 'API_KEY' as const,
      name: 'Stripe API Key',
      regex: /\b(sk_(?:live|test)_[0-9a-zA-Z]{20,})\b/g,
      severity: 'CRITICAL' as const,
      reason: 'Live or test payment processor secret key detected in payload.'
    },
    {
      category: 'API_KEY' as const,
      name: 'GitHub Personal Access Token',
      regex: /\b(ghp_[0-9a-zA-Z]{36})\b/g,
      severity: 'CRITICAL' as const,
      reason: 'Source code management credential detected in payload.'
    },
    {
      category: 'API_KEY' as const,
      name: 'Google Cloud API Key',
      regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
      severity: 'CRITICAL' as const,
      reason: 'Cloud infrastructure API token detected in payload.'
    },
    {
      category: 'API_KEY' as const,
      name: 'Generic Bearer Token',
      regex: /\bBearer\s+([a-zA-Z0-9_\-\.]{20,})\b/gi,
      severity: 'HIGH' as const,
      reason: 'HTTP authorization bearer credential detected.'
    },
    {
      category: 'PASSWORD_CREDENTIAL' as const,
      name: 'Password in Structured Key/Value',
      regex: /(?:password|passwd|client_secret|db_pass|auth_secret)[\s:="']{1,4}(["']?[A-Za-z0-9!@#$%^&*()_+=\-]{6,}["']?)/gi,
      severity: 'CRITICAL' as const,
      reason: 'Plaintext password or authentication secret detected.'
    },
    {
      category: 'GOV_IDENTIFIER' as const,
      name: 'US Social Security Number (SSN)',
      regex: /\b([0-9]{3}-[0-9]{2}-[0-9]{4})\b/g,
      severity: 'HIGH' as const,
      reason: 'Restricted government personal identity number (SSN) detected.'
    },
    {
      category: 'EMAIL_ADDRESS' as const,
      name: 'Email Address',
      regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      severity: 'MEDIUM' as const,
      reason: 'Personal identifiable email address detected.'
    },
    {
      category: 'PHONE_NUMBER' as const,
      name: 'Telephone Number',
      regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      severity: 'MEDIUM' as const,
      reason: 'Personal telephone number detected.'
    }
  ];

  /**
   * Scans any data structure (string, object, array) recursively.
   */
  public scan(
    data: any,
    configuredAction: 'BLOCK' | 'REDACT' | 'ALLOW' = 'BLOCK'
  ): LeakScanResult {
    const findings: LeakFinding[] = [];
    let textToAnalyze = '';

    if (typeof data === 'string') {
      textToAnalyze = data;
    } else if (data && typeof data === 'object') {
      textToAnalyze = JSON.stringify(data);
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return {
        detected: false,
        findings: [],
        actionTaken: 'ALLOW',
        sanitizedData: data,
        summary: 'Payload is clean. No sensitive pattern detected.'
      };
    }

    let sanitizedString = textToAnalyze;

    for (const rule of this.patterns) {
      // Reset regex state
      rule.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.regex.exec(textToAnalyze)) !== null) {
        const fullMatch = match[0];
        const secretPart = match[1] || fullMatch;
        const masked = maskSecret(secretPart);

        findings.push({
          category: rule.category,
          location: `Offset ${match.index} (${rule.name})`,
          reason: rule.reason,
          maskedSample: masked,
          severity: rule.severity
        });

        // Perform in-place redaction on sanitized string copy
        sanitizedString = sanitizedString.replace(secretPart, masked);
      }
    }

    const detected = findings.length > 0;

    let sanitizedData = data;
    if (detected && configuredAction === 'REDACT') {
      try {
        sanitizedData = typeof data === 'string' ? sanitizedString : JSON.parse(sanitizedString);
      } catch {
        sanitizedData = sanitizedString;
      }
    }

    let summary = 'Clean outbound payload.';
    if (detected) {
      const topCat = findings[0].category;
      summary = `Sensitive data leak detected (${findings.length} findings, top category: ${topCat}). Gateway policy enforced: ${configuredAction}.`;
    }

    return {
      detected,
      findings,
      actionTaken: detected ? configuredAction : 'ALLOW',
      sanitizedData: detected && configuredAction === 'BLOCK' ? null : sanitizedData,
      summary
    };
  }
}

export const sensitiveDataScanner = new SensitiveDataScanner();

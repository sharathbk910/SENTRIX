import crypto from 'node:crypto';
import { AuditEvent, IntegrityVerificationResult } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deterministically serialize an object to JSON with sorted keys.
 * This guarantees reproducible hash calculation across platforms and runtimes.
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalJsonStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const entries = keys
    .filter(k => obj[k] !== undefined)
    .map(k => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`);

  return '{' + entries.join(',') + '}';
}

/**
 * Extracts the canonical payload fields for cryptographic hashing.
 * Excludes the self-referential 'hash' field.
 */
export function extractHashablePayload(event: AuditEvent, prevHash: string) {
  return {
    id: event.id,
    action_id: event.action_id,
    agent_id: event.agent_id || 'system',
    event_type: event.event_type || 'ACTION_EVALUATION',
    tool: event.tool,
    operation: event.operation,
    resource: event.resource,
    description: event.description || '',
    decision: event.decision,
    reason: event.reason,
    execution_status: event.execution_status,
    risk_score: typeof event.risk_score === 'number' ? event.risk_score : 50,
    matched_policy_id: event.matched_policy_id || null,
    created_at: event.created_at,
    prev_hash: prevHash
  };
}

/**
 * Computes SHA-256 hash of an audit event linked to its predecessor.
 */
export function computeEventHash(event: AuditEvent, prevHash: string): string {
  const canonicalPayload = canonicalJsonStringify(extractHashablePayload(event, prevHash));
  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

export class AuditHashChainEngine {
  /**
   * Seals a new audit event with the cryptographic hash of its predecessor.
   * Modifies the event in-place with prev_hash and hash.
   */
  public sealEvent(event: AuditEvent, lastEvent?: AuditEvent): AuditEvent {
    const prevHash = lastEvent?.hash || GENESIS_HASH;
    event.prev_hash = prevHash;
    event.hash = computeEventHash(event, prevHash);
    return event;
  }

  /**
   * Re-verifies the entire audit chain from genesis block to current head.
   * Identifies the exact event and index of any detected inconsistency or tampering.
   */
  public verifyIntegrity(events: AuditEvent[]): IntegrityVerificationResult {
    const nowIso = new Date().toISOString();

    if (!events || events.length === 0) {
      return {
        valid: true,
        totalEvents: 0,
        verifiedEvents: 0,
        genesisHash: GENESIS_HASH,
        message: 'Audit log is empty. Integrity baseline is nominal at genesis.',
        timestamp: nowIso
      };
    }

    // Sort chronologically (oldest first) to verify sequence
    const chronological = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < chronological.length; i++) {
      const event = chronological[i];

      // 1. Verify predecessor link
      if (event.prev_hash !== expectedPrevHash) {
        return {
          valid: false,
          totalEvents: chronological.length,
          verifiedEvents: i,
          genesisHash: GENESIS_HASH,
          compromisedAtId: event.id,
          compromisedIndex: i,
          expectedHash: expectedPrevHash,
          actualHash: event.prev_hash,
          message: `CHAIN BROKEN: Event #${i + 1} (${event.id}) prev_hash mismatch. Expected link to '${expectedPrevHash.slice(0, 16)}...', but found '${(event.prev_hash || 'MISSING').slice(0, 16)}...'. Chain sequence was altered or severed.`,
          timestamp: nowIso
        };
      }

      // 2. Recompute cryptographic hash of event content
      const computedHash = computeEventHash(event, event.prev_hash);

      if (event.hash !== computedHash) {
        return {
          valid: false,
          totalEvents: chronological.length,
          verifiedEvents: i,
          genesisHash: GENESIS_HASH,
          compromisedAtId: event.id,
          compromisedIndex: i,
          expectedHash: computedHash,
          actualHash: event.hash,
          message: `TAMPER DETECTED: Content of Event #${i + 1} (${event.id}) has been modified after sealing! Computed hash '${computedHash.slice(0, 16)}...' differs from stored seal '${(event.hash || 'MISSING').slice(0, 16)}...'. Data payload integrity violated.`,
          timestamp: nowIso
        };
      }

      expectedPrevHash = event.hash;
    }

    const latestHash = chronological[chronological.length - 1]?.hash;

    return {
      valid: true,
      totalEvents: chronological.length,
      verifiedEvents: chronological.length,
      genesisHash: GENESIS_HASH,
      latestHash,
      message: `CRYPTOGRAPHIC CHAIN VERIFIED: All ${chronological.length} audit records verified from Genesis (${GENESIS_HASH.slice(0, 12)}...) through Head (${latestHash?.slice(0, 12)}...). Zero tampering, omissions, or sequence modifications detected.`,
      timestamp: nowIso
    };
  }

  /**
   * Intentionally tamper with an event's field for live demonstration.
   * Does NOT recompute the hash or subsequent links, proving that verification fails immediately.
   */
  public simulateTamper(events: AuditEvent[], targetEventId?: string): { success: boolean; eventId: string; originalReason: string; tamperedReason: string } | null {
    if (!events || events.length === 0) return null;

    const target = targetEventId
      ? events.find(e => e.id === targetEventId)
      : events[events.length - 1]; // Tamper with first or latest

    if (!target) return null;

    const originalReason = target.reason;
    target.reason = `[TAMPERED CONTENT] Retroactively altered unauthorized decision. Original rationale overwritten at ${new Date().toISOString()}.`;

    return {
      success: true,
      eventId: target.id,
      originalReason,
      tamperedReason: target.reason
    };
  }
}

export const auditHashChainEngine = new AuditHashChainEngine();

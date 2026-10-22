import { ActionPayload, Policy, PolicyDecision, EvaluationResponse, PolicyConflictWarning } from '../types';
import { policyConflictDetector } from './conflictDetector';

export interface EvaluationResult {
  decision: PolicyDecision;
  matchedPolicy: Policy | null;
  reason: string;
  conflict?: PolicyConflictWarning | null;
}

export class PolicyEngine {
  private policies: Policy[] = [
    {
      id: 'POL-001',
      name: 'Public Catalogue Read Access',
      tool: 'file_store',
      operation: 'read',
      resource_pattern: 'public_catalogue',
      decision: 'ALLOW',
      reason: 'The resource is public and the operation is read-only.',
      enabled: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
    },
    {
      id: 'POL-002',
      name: 'Financial Ledger Protection',
      tool: 'file_store',
      operation: 'delete',
      resource_pattern: 'financial_records_2025',
      decision: 'BLOCK',
      reason: 'Destructive deletion of protected financial records is strictly prohibited by security baseline.',
      enabled: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString()
    },
    {
      id: 'POL-003',
      name: 'Confidential Dossier Transfer Approval',
      tool: 'data_transfer',
      operation: 'transfer',
      resource_pattern: 'confidential_customer_dossier',
      decision: 'REQUIRE_APPROVAL',
      reason: 'Exporting confidential customer records outside the security perimeter requires verified human authorization.',
      enabled: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    },
    {
      id: 'POL-004',
      name: 'Confidential Dossier Export Alias',
      tool: 'data_transfer',
      operation: 'export',
      resource_pattern: 'confidential_customer_dossier',
      decision: 'REQUIRE_APPROVAL',
      reason: 'Data exfiltration safeguard: Exporting customer dossier archives requires two-party consensus approval.',
      enabled: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
    },
    {
      id: 'POL-005',
      name: 'Contradictory Catalogue Block (Demo Conflict)',
      tool: 'file_store',
      operation: 'read',
      resource_pattern: 'public_catalogue',
      decision: 'BLOCK',
      reason: 'Conflicting rule for testing Policy Center conflict alerts and deterministic deny-first fallback.',
      enabled: false, // Disabled by default, easily enabled for testing
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    }
  ];

  public getPolicies(): Policy[] {
    return [...this.policies];
  }

  public getPolicyById(id: string): Policy | undefined {
    return this.policies.find(p => p.id === id);
  }

  public togglePolicy(id: string): Policy | null {
    const policy = this.policies.find(p => p.id === id);
    if (policy) {
      policy.enabled = !policy.enabled;
      return policy;
    }
    return null;
  }

  public getConflicts(): PolicyConflictWarning[] {
    return policyConflictDetector.detectConflicts(this.policies);
  }

  /**
   * Deterministic Policy Evaluation with Policy Conflict & Deny-First Fallback
   */
  public evaluate(payload: ActionPayload): EvaluationResult {
    // 1. Strict Input Validation
    if (!payload || typeof payload !== 'object') {
      return {
        decision: 'BLOCK',
        matchedPolicy: null,
        reason: 'Malformed action payload: Action must be a valid JSON object.'
      };
    }

    const tool = typeof payload.tool === 'string' ? payload.tool.trim() : '';
    const operation = typeof payload.operation === 'string' ? payload.operation.trim() : '';
    const resource = typeof payload.resource === 'string' ? payload.resource.trim() : '';

    if (!tool || !operation || !resource) {
      return {
        decision: 'BLOCK',
        matchedPolicy: null,
        reason: 'Missing mandatory action fields: tool, operation, and resource are required.'
      };
    }

    // 2. CHECK FOR POLICY CONFLICTS FIRST (Feature D)
    const conflict = policyConflictDetector.findConflictForAction({ tool, operation, resource }, this.policies);
    if (conflict) {
      return {
        decision: 'BLOCK',
        matchedPolicy: null,
        reason: `Deterministic Deny-First Fallback: Contradictory policies detected for scope '${conflict.scope}' (${conflict.policyIdA} [${conflict.decisionA}] vs ${conflict.policyIdB} [${conflict.decisionB}]). Access blocked until administrator resolves policy conflict.`,
        conflict
      };
    }

    // 3. Iterate through enabled policies in deterministic priority order
    for (const policy of this.policies) {
      if (!policy.enabled) continue;

      const toolMatch = policy.tool === '*' || policy.tool.toLowerCase() === tool.toLowerCase();
      const opMatch = policy.operation === '*' || policy.operation.toLowerCase() === operation.toLowerCase();
      
      let resourceMatch = false;
      if (policy.resource_pattern === '*') {
        resourceMatch = true;
      } else if (policy.resource_pattern.includes('*')) {
        const regexStr = '^' + policy.resource_pattern.replace(/\*/g, '.*') + '$';
        resourceMatch = new RegExp(regexStr, 'i').test(resource);
      } else {
        resourceMatch = resource.toLowerCase().includes(policy.resource_pattern.toLowerCase());
      }

      if (toolMatch && opMatch && resourceMatch) {
        return {
          decision: policy.decision,
          matchedPolicy: policy,
          reason: policy.reason
        };
      }
    }

    // 4. Fallback: Deny-by-default for unknown tools, operations, or resources
    return {
      decision: 'BLOCK',
      matchedPolicy: null,
      reason: `Deny-by-default: Unrecognized action pattern '${tool}:${operation}' on '${resource}'. No permissive policy found.`
    };
  }
}

export const policyEngine = new PolicyEngine();

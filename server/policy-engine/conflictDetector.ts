import { Policy, PolicyConflictWarning } from '../types';

/**
 * Checks whether two resource patterns overlap.
 * Exact match, wildcard overlap, or substring containment.
 */
function scopesOverlap(scopeA: string, scopeB: string): boolean {
  if (scopeA === '*' || scopeB === '*') return true;
  const a = scopeA.toLowerCase();
  const b = scopeB.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function toolsOverlap(toolA: string, toolB: string): boolean {
  if (toolA === '*' || toolB === '*') return true;
  return toolA.toLowerCase() === toolB.toLowerCase();
}

function operationsOverlap(opA: string, opB: string): boolean {
  if (opA === '*' || opB === '*') return true;
  return opA.toLowerCase() === opB.toLowerCase();
}

export class PolicyConflictDetector {
  /**
   * Scans a list of active policies for overlapping scopes with contradictory decisions.
   */
  public detectConflicts(policies: Policy[]): PolicyConflictWarning[] {
    const conflicts: PolicyConflictWarning[] = [];
    const activePolicies = policies.filter(p => p.enabled);

    for (let i = 0; i < activePolicies.length; i++) {
      for (let j = i + 1; j < activePolicies.length; j++) {
        const p1 = activePolicies[i];
        const p2 = activePolicies[j];

        // Must target overlapping tool, operation, and resource pattern
        if (
          toolsOverlap(p1.tool, p2.tool) &&
          operationsOverlap(p1.operation, p2.operation) &&
          scopesOverlap(p1.resource_pattern, p2.resource_pattern)
        ) {
          // Contradictory decision? E.g. ALLOW vs BLOCK, or ALLOW vs REQUIRE_APPROVAL
          if (p1.decision !== p2.decision) {
            conflicts.push({
              id: `CONF-${p1.id}-${p2.id}`,
              policyIdA: p1.id,
              policyNameA: p1.name,
              decisionA: p1.decision,
              policyIdB: p2.id,
              policyNameB: p2.name,
              decisionB: p2.decision,
              scope: `${p1.tool}:${p1.operation} -> ${p1.resource_pattern}`,
              description: `Contradictory policy decisions detected on matching scope: ${p1.id} mandates '${p1.decision}' whereas ${p2.id} mandates '${p2.decision}'.`,
              fallbackDecision: 'BLOCK'
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if a specific proposed action matches conflicting policies
   */
  public findConflictForAction(
    payload: { tool: string; operation: string; resource: string },
    policies: Policy[]
  ): PolicyConflictWarning | null {
    const allConflicts = this.detectConflicts(policies);
    const tool = payload.tool.toLowerCase();
    const op = payload.operation.toLowerCase();
    const res = payload.resource.toLowerCase();

    for (const conflict of allConflicts) {
      const pA = policies.find(p => p.id === conflict.policyIdA);
      const pB = policies.find(p => p.id === conflict.policyIdB);

      if (pA && pB) {
        const matchA =
          (pA.tool === '*' || pA.tool.toLowerCase() === tool) &&
          (pA.operation === '*' || pA.operation.toLowerCase() === op) &&
          (pA.resource_pattern === '*' || res.includes(pA.resource_pattern.toLowerCase()));

        const matchB =
          (pB.tool === '*' || pB.tool.toLowerCase() === tool) &&
          (pB.operation === '*' || pB.operation.toLowerCase() === op) &&
          (pB.resource_pattern === '*' || res.includes(pB.resource_pattern.toLowerCase()));

        if (matchA && matchB) {
          return conflict;
        }
      }
    }

    return null;
  }
}

export const policyConflictDetector = new PolicyConflictDetector();

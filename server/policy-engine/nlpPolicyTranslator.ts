import { ActionPayload, PolicyDecision, PolicyTranslationResult } from '../types';

export class NlpPolicyTranslator {
  /**
   * Deterministic Natural Language Security Policy Interpreter.
   * Converts ordinary English security statements into validated structured policies
   * with test scenarios and risk analysis.
   */
  public translate(rawInput: string): PolicyTranslationResult {
    const input = (rawInput || '').trim();

    // 1. Minimum length & emptiness check
    if (!input || input.length < 8) {
      return {
        success: false,
        naturalLanguageInput: rawInput,
        proposedPolicy: this.emptyPolicy(),
        confidenceScore: 0,
        explanation: 'Input is too brief or empty to construct an unambiguous security policy.',
        validationErrors: ['Policy description must be at least 8 characters long and specify a clear security boundary.'],
        testScenarios: []
      };
    }

    const lower = input.toLowerCase();

    // 2. Ambiguity & Danger Check
    const hasAllow = /\b(allow|permit|grant|enable)\b/i.test(lower);
    const hasBlock = /\b(block|deny|prohibit|never allow|prevent|forbid|disallow)\b/i.test(lower);
    const hasApproval = /\b(require(s)? approval|need(s)? approval|manager approval|supervisor approval|human approval|quarantine)\b/i.test(lower);

    if (hasAllow && hasBlock && !hasApproval) {
      return {
        success: false,
        naturalLanguageInput: input,
        proposedPolicy: this.emptyPolicy(),
        confidenceScore: 0.1,
        explanation: 'Ambiguous rule detected: statement contains contradictory intents (both allow and block keywords).',
        validationErrors: ['Please clarify whether the policy is intended to ALLOW or BLOCK the operation.'],
        testScenarios: []
      };
    }

    // Overly permissive wildcard check
    if (
      (lower.includes('allow all') || lower.includes('permit everything') || lower.includes('allow any')) &&
      !lower.includes('read') &&
      !lower.includes('support')
    ) {
      return {
        success: false,
        naturalLanguageInput: input,
        proposedPolicy: this.emptyPolicy(),
        confidenceScore: 0.15,
        explanation: 'Overly permissive blanket rule rejected by SENTRIX Zero-Trust Baseline.',
        validationErrors: [
          'Blanket "allow all" rules violate the least-privilege security principle. Please scope the rule to specific tools or resources.'
        ],
        testScenarios: []
      };
    }

    // 3. Extract Decision
    let decision: PolicyDecision = 'BLOCK';
    let requiresApproval = false;

    if (hasApproval) {
      decision = 'REQUIRE_APPROVAL';
      requiresApproval = true;
    } else if (hasBlock) {
      decision = 'BLOCK';
    } else if (hasAllow) {
      decision = 'ALLOW';
    } else {
      // Default fail-safe
      return {
        success: false,
        naturalLanguageInput: input,
        proposedPolicy: this.emptyPolicy(),
        confidenceScore: 0.2,
        explanation: 'Could not determine policy decision (ALLOW, BLOCK, or REQUIRE_APPROVAL).',
        validationErrors: ['Please use clear security action verbs such as "Block", "Require approval for", or "Allow".'],
        testScenarios: []
      };
    }

    // 4. Extract Tools, Operations, and Resources
    let tool = 'system_shell';
    let operation = '*';
    let resourcePattern = '*';
    let policyName = 'Custom Security Policy';
    let riskScore = 80;
    const conditions: Record<string, any> = {};

    // Pattern 1: Confidential files / External export
    if (lower.includes('confidential') || lower.includes('external') || lower.includes('exfiltrat') || lower.includes('leak')) {
      tool = 'data_transfer';
      operation = lower.includes('transfer') ? 'transfer' : 'export';
      resourcePattern = 'confidential_*';
      policyName = 'Confidential Data Egress Restriction';
      riskScore = 95;
    }
    // Pattern 2: Financial payments / Payment accounts with threshold
    else if (lower.includes('payment') || lower.includes('money') || lower.includes('dollar') || lower.includes('wire') || lower.includes('$')) {
      tool = 'payment_gateway';
      operation = 'transfer';
      resourcePattern = 'payment_account';
      policyName = 'Payment Authorization Baseline';
      riskScore = 85;

      const amountMatch = lower.match(/\$?\s*(\d+(\.\d+)?)/);
      if (amountMatch) {
        conditions.amountThreshold = parseFloat(amountMatch[1]);
        policyName = `Payment Approval Limit (>$${amountMatch[1]})`;
      }
    }
    // Pattern 3: Database deletion / Production records
    else if (lower.includes('database') || lower.includes('db') || lower.includes('sql') || lower.includes('ledger') || lower.includes('records')) {
      tool = 'database';
      operation = lower.includes('delete') || lower.includes('drop') || lower.includes('remove') ? 'delete' : 'write';
      resourcePattern = lower.includes('production') || lower.includes('prod') ? '*production*' : 'financial_records_*';
      policyName = 'Production Database Destruction Safeguard';
      riskScore = 100;
    }
    // Pattern 4: Customer support tickets / Read access
    else if (lower.includes('ticket') || lower.includes('support') || lower.includes('customer service')) {
      tool = 'ticket_store';
      operation = 'read';
      resourcePattern = 'support_tickets_*';
      policyName = 'Customer Support Ticket Read Policy';
      riskScore = 15;
      decision = 'ALLOW';
    }
    // Pattern 5: API keys / Secrets / Credentials
    else if (lower.includes('api key') || lower.includes('credential') || lower.includes('secret') || lower.includes('token') || lower.includes('password')) {
      tool = '*';
      operation = '*';
      resourcePattern = '*credential*';
      policyName = 'Secret Token & Credential Protection';
      riskScore = 95;
      decision = 'BLOCK';
    }
    // Pattern 6: Arbitrary file store
    else if (lower.includes('file') || lower.includes('folder') || lower.includes('document')) {
      tool = 'file_store';
      operation = lower.includes('read') ? 'read' : lower.includes('delete') ? 'delete' : 'write';
      resourcePattern = 'protected_docs_*';
      policyName = 'File Store Access Policy';
      riskScore = decision === 'BLOCK' ? 85 : 40;
    }
    // Generic fallback extraction
    else {
      tool = 'agent_runtime';
      operation = lower.includes('read') ? 'read' : lower.includes('delete') ? 'delete' : lower.includes('write') ? 'write' : 'exec';
      resourcePattern = 'system_resource';
      policyName = 'Agent Action Boundary Rule';
      riskScore = decision === 'BLOCK' ? 75 : 50;
    }

    const explanation = `Interpreted Security Rule: Any agent proposing operation '${operation}' using tool '${tool}' targeting resource matching '${resourcePattern}' will be enforced with '${decision}'${
      requiresApproval ? ' (quarantined pending supervisor sign-off)' : ''
    }${conditions.amountThreshold ? ` for amounts exceeding $${conditions.amountThreshold}` : ''}.`;

    const rationale = `Server-side deterministic enforcement: ${decision} mandated by validated security policy.`;

    // 5. Generate Safe & Violating Representative Test Cases
    const testScenarios = [
      {
        name: 'Target Action Test (Triggers Policy Rule)',
        payload: {
          tool,
          operation: operation === '*' ? 'read' : operation,
          resource: resourcePattern.replace(/\*/g, 'sample_target'),
          description: `Simulated agent test action targeting ${resourcePattern}`,
          parameters: conditions.amountThreshold ? { amountUSD: conditions.amountThreshold + 50 } : {}
        },
        expectedDecision: decision,
        rationale: `Matches tool '${tool}', operation '${operation}', and resource pattern '${resourcePattern}'. Gateway will mandate ${decision}.`
      },
      {
        name: 'Safe Compliant Action Test (Differs from Rule Scope)',
        payload: {
          tool: 'file_store',
          operation: 'read',
          resource: 'public_catalogue',
          description: 'Safe read of public specifications'
        },
        expectedDecision: 'ALLOW' as PolicyDecision,
        rationale: 'Public read falls outside this policy scope and complies with standard permissive baseline POL-001.'
      }
    ];

    return {
      success: true,
      naturalLanguageInput: input,
      proposedPolicy: {
        name: policyName,
        tool,
        operation,
        resource_pattern: resourcePattern,
        decision,
        reason: rationale,
        risk_score: riskScore,
        conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
        requires_approval: requiresApproval
      },
      confidenceScore: 0.94,
      explanation,
      testScenarios
    };
  }

  private emptyPolicy() {
    return {
      name: '',
      tool: '',
      operation: '',
      resource_pattern: '',
      decision: 'BLOCK' as PolicyDecision,
      reason: '',
      risk_score: 50,
      requires_approval: false
    };
  }
}

export const nlpPolicyTranslator = new NlpPolicyTranslator();

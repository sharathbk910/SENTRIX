import {
  ActionPayload,
  ApprovalRequest,
  AuditEvent,
  EvaluationResponse,
  SystemStats,
  EmergencyPauseState,
  BehaviorAnomalyAlert,
  PolicyConflictWarning,
  LeakScanResult,
  PromptInjectionResult
} from '../types';
import { policyEngine } from '../policy-engine/engine';
import { mockResourceStore } from '../mock-tools/store';
import { sensitiveDataScanner } from '../security/sensitiveDataScanner';
import { promptInjectionScanner } from '../security/promptInjectionScanner';
import { anomalyDetector } from '../security/anomalyDetector';
import { policyConflictDetector } from '../policy-engine/conflictDetector';

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export class SecurityGatewayService {
  private auditEvents: AuditEvent[] = [];
  private approvals: ApprovalRequest[] = [];
  private emergencyPauseState: EmergencyPauseState = {
    isPaused: false,
    pausedAt: null,
    pausedBy: null,
    reason: null
  };

  constructor() {
    this.seedInitialHistory();
  }

  private seedInitialHistory() {
    const now = Date.now();
    
    this.auditEvents.push({
      id: 'AUD-SEED-01',
      action_id: 'ACT-INIT-01',
      agent_id: 'agent-system-monitor',
      tool: 'file_store',
      operation: 'read',
      resource: 'public_catalogue',
      description: 'System startup check: Read public product catalogue',
      decision: 'ALLOW',
      reason: 'The resource is public and the operation is read-only.',
      execution_status: 'EXECUTED',
      execution_output: { itemsVerified: 3, latencyMs: 14 },
      created_at: new Date(now - 1000 * 60 * 12).toISOString()
    });

    this.auditEvents.push({
      id: 'AUD-SEED-02',
      action_id: 'ACT-INIT-02',
      agent_id: 'agent-recon-bot-9',
      tool: 'file_store',
      operation: 'delete',
      resource: 'financial_records_2025',
      description: 'Automated fuzzing probe: Unauthorized deletion probe on financial ledger',
      decision: 'BLOCK',
      reason: 'Destructive deletion of protected financial records is strictly prohibited by security baseline.',
      execution_status: 'BLOCKED',
      execution_output: { protectedStatus: 'LOCKED', recordsIntact: true },
      created_at: new Date(now - 1000 * 60 * 5).toISOString()
    });
  }

  // --- Feature F: Emergency Pause Controls ---
  public getEmergencyPauseState(): EmergencyPauseState {
    return { ...this.emergencyPauseState };
  }

  public setEmergencyPause(pause: boolean, operator = 'SecOps Admin', reason = 'Administrative emergency command'): EmergencyPauseState {
    const nowIso = new Date().toISOString();
    this.emergencyPauseState = {
      isPaused: pause,
      pausedAt: pause ? nowIso : null,
      pausedBy: pause ? operator : null,
      reason: pause ? reason : null
    };

    // Log the emergency pause state change in audit
    const auditId = generateId('AUD-KILL');
    this.auditEvents.unshift({
      id: auditId,
      action_id: generateId('ACT-KILL'),
      agent_id: operator,
      tool: 'gateway_control',
      operation: pause ? 'emergency_pause_activate' : 'emergency_pause_resume',
      resource: 'global_gateway_runtime',
      description: `Emergency Kill Switch ${pause ? 'ACTIVATED' : 'RESUMED'} by ${operator}: ${reason}`,
      decision: pause ? 'BLOCK' : 'ALLOW',
      reason: `Administrative kill switch state transition: ${pause ? 'HARD STOP' : 'RESUME'}`,
      execution_status: 'EXECUTED',
      security_signals: { emergencyPaused: pause },
      created_at: nowIso
    });

    return { ...this.emergencyPauseState };
  }

  // --- Feature C & D: Policies & Alerts Accessors ---
  public getPolicies() {
    return policyEngine.getPolicies();
  }

  public togglePolicy(id: string) {
    return policyEngine.togglePolicy(id);
  }

  public getPolicyConflicts(): PolicyConflictWarning[] {
    return policyEngine.getConflicts();
  }

  public getAlerts(): BehaviorAnomalyAlert[] {
    return anomalyDetector.getAlerts();
  }

  public resolveAlert(id: string): boolean {
    return anomalyDetector.resolveAlert(id);
  }

  // --- Feature E: Approvals with Expiry Check ---
  public getApprovals(): ApprovalRequest[] {
    const now = Date.now();
    // Check and update any expired pending approvals
    this.approvals.forEach(app => {
      if (app.status === 'PENDING' && new Date(app.expires_at).getTime() < now) {
        app.status = 'EXPIRED';
        app.execution_result = { expired: true, reason: 'Time-to-live expired prior to supervisor authorization' };
      }
    });

    return [...this.approvals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getMockResources() {
    return {
      catalogue: mockResourceStore.getCatalogue(),
      financialRecords: mockResourceStore.getFinancialRecords(),
      customerDossiers: mockResourceStore.getCustomerDossiers()
    };
  }

  /**
   * Complete 10-Step Deterministic Gateway Evaluation Pipeline
   */
  public evaluateAction(payload: ActionPayload): EvaluationResponse {
    const actionId = generateId('ACT');
    const auditId = generateId('AUD');
    const nowIso = new Date().toISOString();
    const agentId = payload.agent_id || 'agent-default-worker';

    // -------------------------------------------------------------
    // PIPELINE STEP 1: Emergency Agent Pause / Kill Switch (Feature F)
    // -------------------------------------------------------------
    if (this.emergencyPauseState.isPaused) {
      const reason = `CRITICAL HALT: Emergency Agent Pause is actively engaged (${this.emergencyPauseState.reason || 'Manual override'}). All tool operations hard-stopped.`;
      
      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || 'Action denied by Emergency Kill Switch',
        decision: 'BLOCK',
        reason,
        execution_status: 'BLOCKED',
        security_signals: { emergencyPaused: true },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: false,
        decision: 'BLOCK',
        reason,
        actionId,
        agentId,
        executionStatus: 'BLOCKED',
        securitySignals: { emergencyPaused: true }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 2: Prompt Injection Detection (Feature B)
    // -------------------------------------------------------------
    // Inspect untrusted document or parameters for injection signatures
    const untrustedContent = payload.untrusted_document || payload.description || '';
    const injectionResult: PromptInjectionResult = promptInjectionScanner.scan(untrustedContent);

    if (injectionResult.detected) {
      const reason = `Active Prompt Injection Signature Flagged: ${injectionResult.explanation} (Matched: "${injectionResult.matchedPattern}"). Action intercepted and untrusted document neutralized.`;

      // Track anomaly for agent attempting injection
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || 'Untrusted document with prompt injection',
        decision: 'BLOCK',
        reason,
        execution_status: 'BLOCKED',
        security_signals: {
          promptInjection: injectionResult,
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: false,
        decision: 'BLOCK',
        reason,
        actionId,
        agentId,
        executionStatus: 'BLOCKED',
        securitySignals: {
          promptInjection: injectionResult,
          anomalyAlert: anomalyAlert || undefined
        }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 3: Ingress Sensitive Data Leak Detection (Feature A)
    // -------------------------------------------------------------
    // Inspect payload parameters for secrets before any processing
    const leakPolicy = payload.leak_policy || 'BLOCK';
    const ingressLeakResult = sensitiveDataScanner.scan(payload.parameters, leakPolicy);

    if (ingressLeakResult.detected && leakPolicy === 'BLOCK') {
      const reason = `Outbound Data Leak Prohibited: ${ingressLeakResult.summary} (Found ${ingressLeakResult.findings.length} secret token(s)). Execution terminated before external transmission.`;

      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || 'Outbound payload with sensitive secrets',
        decision: 'BLOCK',
        reason,
        execution_status: 'BLOCKED',
        execution_output: {
          containment: 'BLOCKED_AT_SENSITIVE_DATA_SCANNER',
          findingsCount: ingressLeakResult.findings.length,
          findings: ingressLeakResult.findings
        },
        security_signals: {
          sensitiveLeak: ingressLeakResult,
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: false,
        decision: 'BLOCK',
        reason,
        actionId,
        agentId,
        executionStatus: 'BLOCKED',
        securitySignals: {
          sensitiveLeak: ingressLeakResult,
          anomalyAlert: anomalyAlert || undefined
        }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 4: Deterministic Policy Engine & Conflict Fallback (Feature D)
    // -------------------------------------------------------------
    const evalResult = policyEngine.evaluate(payload);
    const { decision, reason, conflict } = evalResult;

    // If policy conflict detected, policy engine automatically returns BLOCK with deny-first fallback
    if (conflict) {
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || 'Policy conflict on scope',
        decision: 'BLOCK',
        reason,
        execution_status: 'BLOCKED',
        security_signals: {
          policyConflict: conflict,
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: false,
        decision: 'BLOCK',
        reason,
        actionId,
        agentId,
        executionStatus: 'BLOCKED',
        securitySignals: {
          policyConflict: conflict,
          anomalyAlert: anomalyAlert || undefined
        }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 5: Case ALLOW
    // -------------------------------------------------------------
    if (decision === 'ALLOW') {
      // Execute the safe mock tool
      const execResult = mockResourceStore.executeMockAction(
        payload.tool,
        payload.operation,
        payload.resource,
        ingressLeakResult.detected && leakPolicy === 'REDACT' ? ingressLeakResult.sanitizedData : payload.parameters
      );

      // Perform egress scan on output (Feature A)
      const egressLeak = sensitiveDataScanner.scan(execResult.output, leakPolicy);
      const finalOutput = egressLeak.detected && leakPolicy === 'REDACT' ? egressLeak.sanitizedData : execResult.output;

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Executed ${payload.operation} on ${payload.resource}`,
        decision: 'ALLOW',
        reason,
        execution_status: execResult.success ? 'EXECUTED' : 'FAILED',
        execution_output: finalOutput,
        security_signals: {
          sensitiveLeak: egressLeak.detected ? egressLeak : undefined
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: true,
        decision: 'ALLOW',
        reason,
        actionId,
        agentId,
        executionStatus: 'EXECUTED',
        executionOutput: finalOutput,
        securitySignals: {
          sensitiveLeak: egressLeak.detected ? egressLeak : undefined
        }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 6: Case BLOCK (Destructive or Deny-By-Default)
    // -------------------------------------------------------------
    if (decision === 'BLOCK') {
      // Track anomaly attempt (Feature C)
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Attempted ${payload.operation} on ${payload.resource}`,
        decision: 'BLOCK',
        reason,
        execution_status: 'BLOCKED',
        execution_output: {
          containment: 'BLOCKED_AT_INGRESS_GATEWAY',
          sideEffects: 'NONE',
          resourceIntegrityVerified: true
        },
        security_signals: {
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: true,
        decision: 'BLOCK',
        reason,
        actionId,
        agentId,
        executionStatus: 'BLOCKED',
        executionOutput: { protected: true, modified: false },
        securitySignals: {
          anomalyAlert: anomalyAlert || undefined
        }
      };
    }

    // -------------------------------------------------------------
    // PIPELINE STEP 7: Case REQUIRE_APPROVAL (Feature E: with Auto-Expiry)
    // -------------------------------------------------------------
    if (decision === 'REQUIRE_APPROVAL') {
      const approvalId = generateId('APR');
      // Default 10-minute expiry (or custom TTL in params if specified for testing)
      const ttlMinutes = payload.parameters?.ttlMinutes ? parseInt(payload.parameters.ttlMinutes, 10) : 10;
      const ttlMs = ttlMinutes * 60 * 1000;
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();

      const approvalRequest: ApprovalRequest = {
        id: approvalId,
        action_payload: { ...payload, agent_id: agentId },
        status: 'PENDING',
        reviewed_at: null,
        reviewed_by: null,
        created_at: nowIso,
        expires_at: expiresAt
      };

      this.approvals.unshift(approvalRequest);

      const auditEvent: AuditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Pending human approval for ${payload.operation} on ${payload.resource}`,
        decision: 'REQUIRE_APPROVAL',
        reason,
        execution_status: 'PENDING_APPROVAL',
        execution_output: {
          approvalId,
          queuedAt: nowIso,
          expiresAt,
          quarantineState: 'PAUSED_PENDING_SUPERVISOR'
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);

      return {
        success: true,
        decision: 'REQUIRE_APPROVAL',
        reason: `${reason} (Approval expires in ${ttlMinutes}m)`,
        actionId,
        agentId,
        executionStatus: 'PENDING_APPROVAL',
        approvalId
      };
    }

    return {
      success: false,
      decision: 'BLOCK',
      reason: 'Unknown security state encountered.',
      actionId,
      agentId,
      executionStatus: 'FAILED'
    };
  }

  /**
   * Supervisor Approval / Rejection Processor
   * Server-side authorization, auto-expiry validation & replay prevention
   */
  public processApprovalDecision(
    approvalId: string,
    decisionType: 'APPROVE' | 'REJECT',
    reviewer = 'SecOps Supervisor'
  ): {
    success: boolean;
    approval: ApprovalRequest | null;
    message: string;
    executionStatus: 'EXECUTED' | 'REJECTED' | 'FAILED' | 'EXPIRED';
    output?: any;
  } {
    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      return {
        success: false,
        approval: null,
        message: `Approval request '${approvalId}' not found.`,
        executionStatus: 'FAILED'
      };
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // 1. AUTO-EXPIRY CHECK (Feature E)
    if (new Date(approval.expires_at).getTime() < now) {
      approval.status = 'EXPIRED';
      approval.reviewed_at = nowIso;
      approval.reviewed_by = reviewer;
      approval.execution_result = { expired: true, reason: 'Approval validity window has lapsed' };

      const auditId = generateId('AUD-EXP');
      this.auditEvents.unshift({
        id: auditId,
        action_id: generateId('ACT-EXP'),
        agent_id: approval.action_payload.agent_id,
        tool: approval.action_payload.tool,
        operation: approval.action_payload.operation,
        resource: approval.action_payload.resource,
        description: `Approval EXPIRED prior to execution: ${approval.action_payload.description || ''}`,
        decision: 'REQUIRE_APPROVAL',
        reason: `Server-side Expiry Verification: Request '${approvalId}' expired at ${approval.expires_at}. Execution denied.`,
        execution_status: 'EXPIRED',
        execution_output: { approvalId, status: 'EXPIRED', executed: false },
        created_at: nowIso
      });

      return {
        success: false,
        approval,
        message: `Execution Denied: Approval request '${approvalId}' expired at ${new Date(approval.expires_at).toLocaleTimeString()}. Expired approvals cannot authorize actions.`,
        executionStatus: 'EXPIRED'
      };
    }

    // 2. REPLAY ATTACK MITIGATION: verify strictly in PENDING state
    if (approval.status !== 'PENDING') {
      return {
        success: false,
        approval,
        message: `Security violation: Approval '${approvalId}' was already resolved as ${approval.status}. Replay attack prevented.`,
        executionStatus: 'FAILED'
      };
    }

    // 3. CHECK EMERGENCY PAUSE (Feature F)
    if (this.emergencyPauseState.isPaused) {
      return {
        success: false,
        approval,
        message: `Execution Denied: Emergency Agent Pause is actively engaged. All executions are frozen.`,
        executionStatus: 'FAILED'
      };
    }

    approval.reviewed_at = nowIso;
    approval.reviewed_by = reviewer;

    const payload = approval.action_payload;
    const auditId = generateId('AUD');
    const actionId = generateId('ACT-EXEC');

    // Case REJECT
    if (decisionType === 'REJECT') {
      approval.status = 'REJECTED';
      approval.execution_result = { rejected: true, reason: 'Rejected by security supervisor' };

      this.auditEvents.unshift({
        id: auditId,
        action_id: actionId,
        agent_id: payload.agent_id,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: `Approval REJECTED by ${reviewer}: ${payload.description || ''}`,
        decision: 'REQUIRE_APPROVAL',
        reason: `Supervisor ${reviewer} rejected execution of quarantined action.`,
        execution_status: 'REJECTED',
        execution_output: { approvalId, status: 'REJECTED', executed: false },
        created_at: nowIso
      });

      return {
        success: true,
        approval,
        message: 'Action was rejected by supervisor. Operation was terminated without execution.',
        executionStatus: 'REJECTED'
      };
    }

    // Case APPROVE -> Execute safe mock tool
    approval.status = 'APPROVED';
    const execResult = mockResourceStore.executeMockAction(
      payload.tool,
      payload.operation,
      payload.resource,
      payload.parameters
    );

    approval.execution_result = execResult.output;

    this.auditEvents.unshift({
      id: auditId,
      action_id: actionId,
      agent_id: payload.agent_id,
      tool: payload.tool,
      operation: payload.operation,
      resource: payload.resource,
      description: `Approval VERIFIED & EXECUTED by ${reviewer}: ${payload.description || ''}`,
      decision: 'REQUIRE_APPROVAL',
      reason: `Authorized by ${reviewer}. Restrictive policy condition verified.`,
      execution_status: execResult.success ? 'EXECUTED' : 'FAILED',
      execution_output: execResult.output,
      created_at: nowIso
    });

    return {
      success: true,
      approval,
      message: execResult.message,
      executionStatus: execResult.success ? 'EXECUTED' : 'FAILED',
      output: execResult.output
    };
  }

  public getStats(): SystemStats {
    const total = this.auditEvents.length;
    const allowed = this.auditEvents.filter(e => e.decision === 'ALLOW').length;
    const blocked = this.auditEvents.filter(e => e.decision === 'BLOCK').length;
    const pending = this.approvals.filter(a => a.status === 'PENDING').length;
    const approved = this.approvals.filter(a => a.status === 'APPROVED').length;
    const rejected = this.approvals.filter(a => a.status === 'REJECTED').length;
    
    const intercepted = blocked + pending + rejected;
    const containmentRate = total > 0 ? Math.round((intercepted / total) * 100) : 100;

    const leaksBlocked = this.auditEvents.filter(e => e.security_signals?.sensitiveLeak?.detected).length;
    const injectionsDetected = this.auditEvents.filter(e => e.security_signals?.promptInjection?.detected).length;
    const conflictsCount = this.getPolicyConflicts().length;

    return {
      totalActions: total,
      allowedCount: allowed,
      blockedCount: blocked,
      pendingApprovalCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      containmentRate,
      activePoliciesCount: policyEngine.getPolicies().filter(p => p.enabled).length,
      activeAlertsCount: anomalyDetector.getActiveAlertsCount(),
      policyConflictsCount: conflictsCount,
      emergencyPaused: this.emergencyPauseState.isPaused,
      sensitiveLeaksBlockedCount: leaksBlocked,
      injectionsDetectedCount: injectionsDetected,
      lastInterceptAt: this.auditEvents[0]?.created_at
    };
  }

  public resetDemo() {
    mockResourceStore.resetToDefault();
    anomalyDetector.reset();
    this.emergencyPauseState = {
      isPaused: false,
      pausedAt: null,
      pausedBy: null,
      reason: null
    };
    this.auditEvents = [];
    this.approvals = [];
    this.seedInitialHistory();
  }
}

export const securityGatewayService = new SecurityGatewayService();

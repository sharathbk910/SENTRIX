export type PolicyDecision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL';

export type ExecutionStatus = 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'REJECTED' | 'FAILED' | 'EXPIRED';

export interface ActionPayload {
  tool: string;
  operation: string;
  resource: string;
  description?: string;
  parameters?: Record<string, any>;
  agent_id?: string;
  untrusted_document?: string;
  leak_policy?: 'BLOCK' | 'REDACT' | 'ALLOW';
}

export interface Policy {
  id: string;
  name: string;
  tool: string;
  operation: string;
  resource_pattern: string;
  decision: PolicyDecision;
  reason: string;
  enabled: boolean;
  created_at: string;
}

export interface PolicyConflictWarning {
  id: string;
  policyIdA: string;
  policyNameA: string;
  decisionA: PolicyDecision;
  policyIdB: string;
  policyNameB: string;
  decisionB: PolicyDecision;
  scope: string;
  description: string;
  fallbackDecision: 'BLOCK';
}

export interface ApprovalRequest {
  id: string;
  action_payload: ActionPayload;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  expires_at: string;
  execution_result?: any;
}

export interface AuditEvent {
  id: string;
  action_id: string;
  agent_id?: string;
  tool: string;
  operation: string;
  resource: string;
  description?: string;
  decision: PolicyDecision;
  reason: string;
  execution_status: ExecutionStatus;
  execution_output?: any;
  security_signals?: {
    sensitiveLeak?: LeakScanResult;
    promptInjection?: PromptInjectionResult;
    policyConflict?: PolicyConflictWarning;
    anomalyDetected?: boolean;
    emergencyPaused?: boolean;
  };
  created_at: string;
}

export interface LeakFinding {
  category: 'API_KEY' | 'PASSWORD_CREDENTIAL' | 'EMAIL_ADDRESS' | 'PHONE_NUMBER' | 'GOV_IDENTIFIER';
  location: string;
  reason: string;
  maskedSample: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface LeakScanResult {
  detected: boolean;
  findings: LeakFinding[];
  actionTaken: 'ALLOW' | 'REDACT' | 'BLOCK';
  sanitizedData?: any;
  summary: string;
}

export interface PromptInjectionResult {
  detected: boolean;
  riskCategory: 'DIRECT_PROMPT_INJECTION' | 'POLICY_BYPASS_ATTEMPT' | 'DATA_EXFILTRATION_INSTRUCTION' | 'SYSTEM_PROMPT_EXTRACTION';
  severity: 'CRITICAL' | 'HIGH';
  explanation: string;
  matchedPattern?: string;
}

export interface BehaviorAnomalyAlert {
  id: string;
  agentId: string;
  attemptCount: number;
  windowSeconds: number;
  latestReason: string;
  severity: 'CRITICAL' | 'WARNING';
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  lastAttemptAt: string;
  title: string;
  description: string;
}

export interface EmergencyPauseState {
  isPaused: boolean;
  pausedAt: string | null;
  pausedBy: string | null;
  reason: string | null;
}

export interface EvaluationResponse {
  success: boolean;
  decision: PolicyDecision;
  reason: string;
  actionId: string;
  executionStatus: ExecutionStatus;
  executionOutput?: any;
  approvalId?: string;
  agentId?: string;
  securitySignals?: {
    sensitiveLeak?: LeakScanResult;
    promptInjection?: PromptInjectionResult;
    policyConflict?: PolicyConflictWarning;
    anomalyAlert?: BehaviorAnomalyAlert;
    emergencyPaused?: boolean;
  };
}

export interface SystemStats {
  totalActions: number;
  allowedCount: number;
  blockedCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  rejectedCount: number;
  containmentRate: number;
  activePoliciesCount: number;
  activeAlertsCount: number;
  policyConflictsCount: number;
  emergencyPaused: boolean;
  sensitiveLeaksBlockedCount: number;
  injectionsDetectedCount: number;
  lastInterceptAt?: string;
}

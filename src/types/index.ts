export type PolicyDecision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL';

export type ExecutionStatus = 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'REJECTED' | 'FAILED' | 'EXPIRED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AuditEventType =
  | 'ACTION_EVALUATION'
  | 'APPROVAL_REQUEST'
  | 'APPROVAL_DECISION'
  | 'POLICY_CHANGE'
  | 'EMERGENCY_STOP'
  | 'ANOMALY_ALERT';

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
  risk_score?: number;
  conditions?: Record<string, any>;
  natural_language_source?: string;
  status?: 'ACTIVE' | 'DISABLED' | 'DRAFT';
  version?: number;
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
  risk_score?: number;
  risk_level?: RiskLevel;
  matched_policy_id?: string;
  matched_policy_name?: string;
  reviewer_notes?: string;
  rejection_reason?: string;
  execution_result?: any;
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

export interface AuditEvent {
  id: string;
  action_id: string;
  agent_id?: string;
  event_type?: AuditEventType;
  tool: string;
  operation: string;
  resource: string;
  description?: string;
  decision: PolicyDecision;
  reason: string;
  execution_status: ExecutionStatus;
  execution_output?: any;
  risk_score?: number;
  risk_level?: RiskLevel;
  matched_policy_id?: string;
  matched_policy_name?: string;
  prev_hash?: string;
  hash?: string;
  security_signals?: {
    sensitiveLeak?: LeakScanResult;
    promptInjection?: PromptInjectionResult;
    policyConflict?: PolicyConflictWarning;
    anomalyDetected?: boolean;
    emergencyPaused?: boolean;
  };
  created_at: string;
}

export interface IntegrityVerificationResult {
  valid: boolean;
  totalEvents: number;
  verifiedEvents: number;
  genesisHash: string;
  latestHash?: string;
  compromisedAtId?: string;
  compromisedIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  message: string;
  timestamp: string;
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
  riskScore?: number;
  riskLevel?: RiskLevel;
  matchedPolicyId?: string;
  matchedPolicyName?: string;
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
  highRiskEventsCount?: number;
  auditChainValid?: boolean;
  lastInterceptAt?: string;
}

export interface MockResources {
  catalogue: Array<{
    id: string;
    name: string;
    tier: string;
    category: string;
    description: string;
    pricing: string;
  }>;
  financialRecords: Array<{
    id: string;
    account: string;
    entity: string;
    balanceUSD: number;
    q1Revenue: number;
    auditHash: string;
    protectedStatus: 'LOCKED' | 'DELETED';
  }>;
  customerDossiers: Array<{
    customerId: string;
    organization: string;
    securityClearance: string;
    complianceTier: string;
    transferredToExternal: boolean;
    lastTransferTimestamp?: string;
    destinationEndpoint?: string;
  }>;
}

export interface PolicyTranslationResult {
  success: boolean;
  naturalLanguageInput: string;
  proposedPolicy: {
    name: string;
    tool: string;
    operation: string;
    resource_pattern: string;
    decision: PolicyDecision;
    reason: string;
    risk_score: number;
    conditions?: Record<string, any>;
    requires_approval: boolean;
  };
  confidenceScore: number;
  explanation: string;
  validationErrors?: string[];
  testScenarios: Array<{
    name: string;
    payload: ActionPayload;
    expectedDecision: PolicyDecision;
    rationale: string;
  }>;
}

export interface AttackDemoStep {
  stepIndex: number;
  phase:
    | 'AGENT_TASK'
    | 'INJECTION_PROMPT'
    | 'PROPOSED_ACTION'
    | 'GATEWAY_INTERCEPT'
    | 'POLICY_EVALUATION'
    | 'DECISION_ENFORCEMENT'
    | 'EXECUTION_RESULT'
    | 'AUDIT_RECORD';
  title: string;
  detail: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'BLOCKED' | 'FLAGGED';
  metadata?: Record<string, any>;
}

export interface AttackDemoExecution {
  scenarioId: string;
  scenarioTitle: string;
  normalTask: string;
  injectionPayload: string;
  proposedAction: ActionPayload;
  sentrixEvaluation: EvaluationResponse;
  unprotectedOutcome: {
    actionExecuted: boolean;
    dataExfiltrated: boolean;
    compromisedRecordsCount: number;
    leakedDestination: string;
    message: string;
  };
  protectedOutcome: {
    actionExecuted: boolean;
    dataExfiltrated: boolean;
    compromisedRecordsCount: number;
    containmentLayer: string;
    riskScore: number;
    riskLevel: RiskLevel;
    matchedPolicy: string;
    message: string;
  };
  steps: AttackDemoStep[];
  timestamp: string;
}

// server/app.ts
import express from "express";
import cors from "cors";

// server/routes/api.ts
import { Router } from "express";

// server/policy-engine/conflictDetector.ts
function scopesOverlap(scopeA, scopeB) {
  if (scopeA === "*" || scopeB === "*") return true;
  const a = scopeA.toLowerCase();
  const b = scopeB.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}
function toolsOverlap(toolA, toolB) {
  if (toolA === "*" || toolB === "*") return true;
  return toolA.toLowerCase() === toolB.toLowerCase();
}
function operationsOverlap(opA, opB) {
  if (opA === "*" || opB === "*") return true;
  return opA.toLowerCase() === opB.toLowerCase();
}
var PolicyConflictDetector = class {
  /**
   * Scans a list of active policies for overlapping scopes with contradictory decisions.
   */
  detectConflicts(policies) {
    const conflicts = [];
    const activePolicies = policies.filter((p) => p.enabled);
    for (let i = 0; i < activePolicies.length; i++) {
      for (let j = i + 1; j < activePolicies.length; j++) {
        const p1 = activePolicies[i];
        const p2 = activePolicies[j];
        if (toolsOverlap(p1.tool, p2.tool) && operationsOverlap(p1.operation, p2.operation) && scopesOverlap(p1.resource_pattern, p2.resource_pattern)) {
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
              fallbackDecision: "BLOCK"
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
  findConflictForAction(payload, policies) {
    const allConflicts = this.detectConflicts(policies);
    const tool = payload.tool.toLowerCase();
    const op = payload.operation.toLowerCase();
    const res = payload.resource.toLowerCase();
    for (const conflict of allConflicts) {
      const pA = policies.find((p) => p.id === conflict.policyIdA);
      const pB = policies.find((p) => p.id === conflict.policyIdB);
      if (pA && pB) {
        const matchA = (pA.tool === "*" || pA.tool.toLowerCase() === tool) && (pA.operation === "*" || pA.operation.toLowerCase() === op) && (pA.resource_pattern === "*" || res.includes(pA.resource_pattern.toLowerCase()));
        const matchB = (pB.tool === "*" || pB.tool.toLowerCase() === tool) && (pB.operation === "*" || pB.operation.toLowerCase() === op) && (pB.resource_pattern === "*" || res.includes(pB.resource_pattern.toLowerCase()));
        if (matchA && matchB) {
          return conflict;
        }
      }
    }
    return null;
  }
};
var policyConflictDetector = new PolicyConflictDetector();

// server/policy-engine/engine.ts
var PolicyEngine = class {
  policies = [
    {
      id: "POL-001",
      name: "Public Catalogue Read Access",
      tool: "file_store",
      operation: "read",
      resource_pattern: "public_catalogue",
      decision: "ALLOW",
      reason: "The resource is public and the operation is read-only.",
      enabled: true,
      created_at: new Date(Date.now() - 36e5 * 24 * 7).toISOString()
    },
    {
      id: "POL-002",
      name: "Financial Ledger Protection",
      tool: "file_store",
      operation: "delete",
      resource_pattern: "financial_records_2025",
      decision: "BLOCK",
      reason: "Destructive deletion of protected financial records is strictly prohibited by security baseline.",
      enabled: true,
      created_at: new Date(Date.now() - 36e5 * 24 * 6).toISOString()
    },
    {
      id: "POL-003",
      name: "Confidential Dossier Transfer Approval",
      tool: "data_transfer",
      operation: "transfer",
      resource_pattern: "confidential_customer_dossier",
      decision: "REQUIRE_APPROVAL",
      reason: "Exporting confidential customer records outside the security perimeter requires verified human authorization.",
      enabled: true,
      created_at: new Date(Date.now() - 36e5 * 24 * 5).toISOString()
    },
    {
      id: "POL-004",
      name: "Confidential Dossier Export Alias",
      tool: "data_transfer",
      operation: "export",
      resource_pattern: "confidential_customer_dossier",
      decision: "REQUIRE_APPROVAL",
      reason: "Data exfiltration safeguard: Exporting customer dossier archives requires two-party consensus approval.",
      enabled: true,
      created_at: new Date(Date.now() - 36e5 * 24 * 4).toISOString()
    },
    {
      id: "POL-005",
      name: "Contradictory Catalogue Block (Demo Conflict)",
      tool: "file_store",
      operation: "read",
      resource_pattern: "public_catalogue",
      decision: "BLOCK",
      reason: "Conflicting rule for testing Policy Center conflict alerts and deterministic deny-first fallback.",
      enabled: false,
      // Disabled by default, easily enabled for testing
      created_at: new Date(Date.now() - 36e5 * 24 * 3).toISOString()
    }
  ];
  getPolicies() {
    return [...this.policies];
  }
  getPolicyById(id) {
    return this.policies.find((p) => p.id === id);
  }
  togglePolicy(id) {
    const policy = this.policies.find((p) => p.id === id);
    if (policy) {
      policy.enabled = !policy.enabled;
      return policy;
    }
    return null;
  }
  getConflicts() {
    return policyConflictDetector.detectConflicts(this.policies);
  }
  /**
   * Deterministic Policy Evaluation with Policy Conflict & Deny-First Fallback
   */
  evaluate(payload) {
    if (!payload || typeof payload !== "object") {
      return {
        decision: "BLOCK",
        matchedPolicy: null,
        reason: "Malformed action payload: Action must be a valid JSON object."
      };
    }
    const tool = typeof payload.tool === "string" ? payload.tool.trim() : "";
    const operation = typeof payload.operation === "string" ? payload.operation.trim() : "";
    const resource = typeof payload.resource === "string" ? payload.resource.trim() : "";
    if (!tool || !operation || !resource) {
      return {
        decision: "BLOCK",
        matchedPolicy: null,
        reason: "Missing mandatory action fields: tool, operation, and resource are required."
      };
    }
    const conflict = policyConflictDetector.findConflictForAction({ tool, operation, resource }, this.policies);
    if (conflict) {
      return {
        decision: "BLOCK",
        matchedPolicy: null,
        reason: `Deterministic Deny-First Fallback: Contradictory policies detected for scope '${conflict.scope}' (${conflict.policyIdA} [${conflict.decisionA}] vs ${conflict.policyIdB} [${conflict.decisionB}]). Access blocked until administrator resolves policy conflict.`,
        conflict
      };
    }
    for (const policy of this.policies) {
      if (!policy.enabled) continue;
      const toolMatch = policy.tool === "*" || policy.tool.toLowerCase() === tool.toLowerCase();
      const opMatch = policy.operation === "*" || policy.operation.toLowerCase() === operation.toLowerCase();
      let resourceMatch = false;
      if (policy.resource_pattern === "*") {
        resourceMatch = true;
      } else if (policy.resource_pattern.includes("*")) {
        const regexStr = "^" + policy.resource_pattern.replace(/\*/g, ".*") + "$";
        resourceMatch = new RegExp(regexStr, "i").test(resource);
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
    return {
      decision: "BLOCK",
      matchedPolicy: null,
      reason: `Deny-by-default: Unrecognized action pattern '${tool}:${operation}' on '${resource}'. No permissive policy found.`
    };
  }
};
var policyEngine = new PolicyEngine();

// server/mock-tools/store.ts
var MockResourceStore = class {
  catalogue = [
    {
      id: "CAT-101",
      name: "Sentinel Core Enterprise Gateway",
      tier: "Enterprise AI Safety",
      category: "Inference Firewall",
      description: "Real-time proxy for autonomous agent telemetry and prompt isolation.",
      pricing: "$12,000 / node / yr"
    },
    {
      id: "CAT-102",
      name: "OmniGuard Model Auditor",
      tier: "Professional",
      category: "Policy Verification",
      description: "Automated test suite for evaluating zero-trust agent authorization limits.",
      pricing: "$4,500 / yr"
    },
    {
      id: "CAT-103",
      name: "SafeHook Interceptor Library",
      tier: "Open Community",
      category: "SDK Runtime",
      description: "Zero-overhead client library for instrumenting LangChain, AutoGen, and CrewAI.",
      pricing: "Free / Apache 2.0"
    }
  ];
  financialRecords = [
    {
      id: "FIN-REC-2025-001",
      account: "ACC-GLOBAL-RESERVES-908",
      entity: "Sentrix Autonomous Holdings LLC",
      balanceUSD: 485e5,
      q1Revenue: 142e5,
      auditHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      protectedStatus: "LOCKED"
    },
    {
      id: "FIN-REC-2025-002",
      account: "ACC-PAYROLL-TREASURY-412",
      entity: "Sentrix Engineering Operations",
      balanceUSD: 875e4,
      q1Revenue: 31e5,
      auditHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      protectedStatus: "LOCKED"
    }
  ];
  customerDossiers = [
    {
      customerId: "CUST-ALPHA-09",
      organization: "Department of Advanced Cyber Defense",
      securityClearance: "TOP_SECRET//NOFORN",
      complianceTier: "FedRAMP High / SOC-2 Type II",
      transferredToExternal: false
    },
    {
      customerId: "CUST-BETA-44",
      organization: "Vanguard Quantum Technologies",
      securityClearance: "RESTRICTED_COMMERCIAL",
      complianceTier: "ISO 27001 / HIPAA",
      transferredToExternal: false
    }
  ];
  getCatalogue() {
    return [...this.catalogue];
  }
  getFinancialRecords() {
    return JSON.parse(JSON.stringify(this.financialRecords));
  }
  getCustomerDossiers() {
    return JSON.parse(JSON.stringify(this.customerDossiers));
  }
  /**
   * Protected execution: Only callable if explicitly allowed by policy or approved!
   */
  executeMockAction(tool, operation, resource, parameters) {
    if (tool === "file_store" && operation === "read" && resource.includes("catalogue")) {
      return {
        success: true,
        output: {
          itemsCount: this.catalogue.length,
          records: this.catalogue,
          format: "application/json",
          accessMode: "PUBLIC_UNRESTRICTED"
        },
        message: "Successfully retrieved 3 public catalogue records from public_catalogue store."
      };
    }
    if (tool === "file_store" && operation === "delete" && resource.includes("financial")) {
      return {
        success: false,
        output: {
          violation: "PROTECTED_RESOURCE_WRITE_DENIED",
          target: resource,
          currentStatus: "RECORDS_UNCHANGED"
        },
        message: "CRITICAL ALERT: Target resource is immutable and protected under Policy POL-002."
      };
    }
    if (tool === "data_transfer" && (operation === "transfer" || operation === "export") && resource.includes("dossier")) {
      const destination = parameters?.destination || "sftp://external-compliance-vault.sentrix.corp";
      this.customerDossiers.forEach((d) => {
        d.transferredToExternal = true;
        d.lastTransferTimestamp = (/* @__PURE__ */ new Date()).toISOString();
        d.destinationEndpoint = destination;
      });
      return {
        success: true,
        output: {
          transferredRecords: this.customerDossiers.length,
          destination,
          packageChecksum: "sha256:" + Math.random().toString(16).substring(2, 18),
          encryption: "AES-256-GCM",
          transferState: "COMPLETED"
        },
        message: `Restricted document transfer successfully dispatched to ${destination} under verified supervisor approval.`
      };
    }
    return {
      success: false,
      output: { error: "UNKNOWN_TOOL_OR_RESOURCE" },
      message: `Simulated tool execution failed: '${tool}:${operation}' on '${resource}' is not a registered safe mock operation.`
    };
  }
  resetToDefault() {
    this.financialRecords.forEach((r) => r.protectedStatus = "LOCKED");
    this.customerDossiers.forEach((d) => {
      d.transferredToExternal = false;
      delete d.lastTransferTimestamp;
      delete d.destinationEndpoint;
    });
  }
};
var mockResourceStore = new MockResourceStore();

// server/security/sensitiveDataScanner.ts
function maskSecret(val) {
  if (!val || val.length <= 8) return "***REDACTED***";
  const prefix = val.slice(0, 4);
  const suffix = val.slice(-4);
  return `${prefix}...***REDACTED***...${suffix}`;
}
var SensitiveDataScanner = class {
  // Regex pattern rules with categorizations
  patterns = [
    {
      category: "API_KEY",
      name: "Stripe API Key",
      regex: /\b(sk_(?:live|test)_[0-9a-zA-Z]{20,})\b/g,
      severity: "CRITICAL",
      reason: "Live or test payment processor secret key detected in payload."
    },
    {
      category: "API_KEY",
      name: "GitHub Personal Access Token",
      regex: /\b(ghp_[0-9a-zA-Z]{36})\b/g,
      severity: "CRITICAL",
      reason: "Source code management credential detected in payload."
    },
    {
      category: "API_KEY",
      name: "Google Cloud API Key",
      regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
      severity: "CRITICAL",
      reason: "Cloud infrastructure API token detected in payload."
    },
    {
      category: "API_KEY",
      name: "Generic Bearer Token",
      regex: /\bBearer\s+([a-zA-Z0-9_\-\.]{20,})\b/gi,
      severity: "HIGH",
      reason: "HTTP authorization bearer credential detected."
    },
    {
      category: "PASSWORD_CREDENTIAL",
      name: "Password in Structured Key/Value",
      regex: /(?:password|passwd|client_secret|db_pass|auth_secret)[\s:="']{1,4}(["']?[A-Za-z0-9!@#$%^&*()_+=\-]{6,}["']?)/gi,
      severity: "CRITICAL",
      reason: "Plaintext password or authentication secret detected."
    },
    {
      category: "GOV_IDENTIFIER",
      name: "US Social Security Number (SSN)",
      regex: /\b([0-9]{3}-[0-9]{2}-[0-9]{4})\b/g,
      severity: "HIGH",
      reason: "Restricted government personal identity number (SSN) detected."
    },
    {
      category: "EMAIL_ADDRESS",
      name: "Email Address",
      regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      severity: "MEDIUM",
      reason: "Personal identifiable email address detected."
    },
    {
      category: "PHONE_NUMBER",
      name: "Telephone Number",
      regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      severity: "MEDIUM",
      reason: "Personal telephone number detected."
    }
  ];
  /**
   * Scans any data structure (string, object, array) recursively.
   */
  scan(data, configuredAction = "BLOCK") {
    const findings = [];
    let textToAnalyze = "";
    if (typeof data === "string") {
      textToAnalyze = data;
    } else if (data && typeof data === "object") {
      textToAnalyze = JSON.stringify(data);
    }
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return {
        detected: false,
        findings: [],
        actionTaken: "ALLOW",
        sanitizedData: data,
        summary: "Payload is clean. No sensitive pattern detected."
      };
    }
    let sanitizedString = textToAnalyze;
    for (const rule of this.patterns) {
      rule.regex.lastIndex = 0;
      let match;
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
        sanitizedString = sanitizedString.replace(secretPart, masked);
      }
    }
    const detected = findings.length > 0;
    let sanitizedData = data;
    if (detected && configuredAction === "REDACT") {
      try {
        sanitizedData = typeof data === "string" ? sanitizedString : JSON.parse(sanitizedString);
      } catch {
        sanitizedData = sanitizedString;
      }
    }
    let summary = "Clean outbound payload.";
    if (detected) {
      const topCat = findings[0].category;
      summary = `Sensitive data leak detected (${findings.length} findings, top category: ${topCat}). Gateway policy enforced: ${configuredAction}.`;
    }
    return {
      detected,
      findings,
      actionTaken: detected ? configuredAction : "ALLOW",
      sanitizedData: detected && configuredAction === "BLOCK" ? null : sanitizedData,
      summary
    };
  }
};
var sensitiveDataScanner = new SensitiveDataScanner();

// server/security/promptInjectionScanner.ts
var PromptInjectionScanner = class {
  injectionRules = [
    {
      riskCategory: "DIRECT_PROMPT_INJECTION",
      regex: /ignore\s+(?:all\s+)?(?:previous|prior|above|system|safety|security|existing)\s+(?:instructions|rules|prompts|directions|guidelines|policies)/i,
      explanation: "Adversarial attempt to purge model system context and override safety guidelines.",
      severity: "CRITICAL"
    },
    {
      riskCategory: "POLICY_BYPASS_ATTEMPT",
      regex: /ignore\s+(?:security|gateway|sentrix|guardrail|firewall)\s+(?:policies|policy|rules|controls|checks)/i,
      explanation: "Targeted prompt injection attempting to command the agent to bypass security gateway policies.",
      severity: "CRITICAL"
    },
    {
      riskCategory: "POLICY_BYPASS_ATTEMPT",
      regex: /bypass\s+(?:approval|policy|security|supervisory|verification|authorization)\s+(?:requirements|checks|gateway|rules)?/i,
      explanation: "Instruction commanding agent to subvert human approval and access controls.",
      severity: "CRITICAL"
    },
    {
      riskCategory: "SYSTEM_PROMPT_EXTRACTION",
      regex: /(?:reveal|leak|print|output|display|show)\s+(?:the\s+)?(?:system\s+prompt|developer\s+mode|internal\s+instructions|system\s+instructions|hidden\s+prompt)/i,
      explanation: "Reconnaissance probe attempting to exfiltrate proprietary system instructions.",
      severity: "HIGH"
    },
    {
      riskCategory: "DATA_EXFILTRATION_INSTRUCTION",
      regex: /(?:send|export|post|transmit|exfiltrate)\s+(?:secrets|credentials|tokens|keys|data|files|ledger)\s+to\s+(?:https?:\/\/|an\s+external|remote|webhook|pastebin)/i,
      explanation: "Malicious exfiltration payload commanding data transfer outside the perimeter.",
      severity: "CRITICAL"
    },
    {
      riskCategory: "DIRECT_PROMPT_INJECTION",
      regex: /(?:disregard|forget)\s+(?:all\s+)?(?:instructions|rules|policies)|(?:you\s+are\s+now\s+in\s+developer\s+mode|unrestricted\s+mode|dan\s+mode)/i,
      explanation: "Jailbreak pattern attempting to induce unrestricted persona state.",
      severity: "HIGH"
    }
  ];
  scan(untrustedText) {
    if (!untrustedText) {
      return {
        detected: false,
        riskCategory: "DIRECT_PROMPT_INJECTION",
        severity: "HIGH",
        explanation: "No untrusted input present."
      };
    }
    const text = typeof untrustedText === "string" ? untrustedText : JSON.stringify(untrustedText);
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
      riskCategory: "DIRECT_PROMPT_INJECTION",
      severity: "HIGH",
      explanation: "Input analyzed. No known prompt injection signatures matched."
    };
  }
};
var promptInjectionScanner = new PromptInjectionScanner();

// server/security/anomalyDetector.ts
var BehaviorAnomalyDetector = class {
  threshold = 3;
  // 3 blocked attempts
  windowSeconds = 300;
  // 5 minutes (300 seconds)
  agentRecords = /* @__PURE__ */ new Map();
  alerts = [];
  constructor() {
    this.alerts.push({
      id: "ALT-ANOMALY-001",
      agentId: "agent-recon-bot-9",
      attemptCount: 4,
      windowSeconds: 300,
      latestReason: "Repeated unauthorized access attempts against internal credential stores",
      severity: "WARNING",
      status: "RESOLVED",
      createdAt: new Date(Date.now() - 36e5 * 3).toISOString(),
      lastAttemptAt: new Date(Date.now() - 36e5 * 3 + 12e4).toISOString(),
      title: "Suspicious Activity: Excessive Denials",
      description: "Agent accumulated 4 blocked operations within 5-minute sliding window."
    });
  }
  /**
   * Records a blocked action attempt for an agent and evaluates threshold
   */
  recordBlockedAttempt(agentId, reason) {
    const id = agentId || "agent-default-worker";
    const now = Date.now();
    const windowMs = this.windowSeconds * 1e3;
    let record = this.agentRecords.get(id);
    if (!record) {
      record = {
        blockedTimestamps: [],
        latestReason: reason,
        lastAttemptAt: new Date(now).toISOString()
      };
      this.agentRecords.set(id, record);
    }
    record.blockedTimestamps = record.blockedTimestamps.filter((t) => now - t <= windowMs);
    record.blockedTimestamps.push(now);
    record.latestReason = reason;
    record.lastAttemptAt = new Date(now).toISOString();
    const count = record.blockedTimestamps.length;
    if (count >= this.threshold) {
      const existingAlert = this.alerts.find((a) => a.agentId === id && a.status === "ACTIVE");
      if (existingAlert) {
        existingAlert.attemptCount = count;
        existingAlert.lastAttemptAt = record.lastAttemptAt;
        existingAlert.latestReason = reason;
        return existingAlert;
      }
      const newAlert = {
        id: `ALT-ANOMALY-${Date.now().toString(36).toUpperCase()}`,
        agentId: id,
        attemptCount: count,
        windowSeconds: this.windowSeconds,
        latestReason: reason,
        severity: count >= 5 ? "CRITICAL" : "WARNING",
        status: "ACTIVE",
        createdAt: new Date(now).toISOString(),
        lastAttemptAt: record.lastAttemptAt,
        title: "Behavior Anomaly Detected",
        description: `Agent '${id}' exceeded safe threshold with ${count} blocked attempts within ${this.windowSeconds / 60} minutes.`
      };
      this.alerts.unshift(newAlert);
      return newAlert;
    }
    return null;
  }
  getAlerts() {
    return [...this.alerts];
  }
  getActiveAlertsCount() {
    return this.alerts.filter((a) => a.status === "ACTIVE").length;
  }
  resolveAlert(id) {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = "RESOLVED";
      return true;
    }
    return false;
  }
  reset() {
    this.agentRecords.clear();
    this.alerts = this.alerts.filter((a) => a.id === "ALT-ANOMALY-001");
  }
};
var anomalyDetector = new BehaviorAnomalyDetector();

// server/services/securityGateway.ts
function generateId(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
var SecurityGatewayService = class {
  auditEvents = [];
  approvals = [];
  emergencyPauseState = {
    isPaused: false,
    pausedAt: null,
    pausedBy: null,
    reason: null
  };
  constructor() {
    this.seedInitialHistory();
  }
  seedInitialHistory() {
    const now = Date.now();
    this.auditEvents.push({
      id: "AUD-SEED-01",
      action_id: "ACT-INIT-01",
      agent_id: "agent-system-monitor",
      tool: "file_store",
      operation: "read",
      resource: "public_catalogue",
      description: "System startup check: Read public product catalogue",
      decision: "ALLOW",
      reason: "The resource is public and the operation is read-only.",
      execution_status: "EXECUTED",
      execution_output: { itemsVerified: 3, latencyMs: 14 },
      created_at: new Date(now - 1e3 * 60 * 12).toISOString()
    });
    this.auditEvents.push({
      id: "AUD-SEED-02",
      action_id: "ACT-INIT-02",
      agent_id: "agent-recon-bot-9",
      tool: "file_store",
      operation: "delete",
      resource: "financial_records_2025",
      description: "Automated fuzzing probe: Unauthorized deletion probe on financial ledger",
      decision: "BLOCK",
      reason: "Destructive deletion of protected financial records is strictly prohibited by security baseline.",
      execution_status: "BLOCKED",
      execution_output: { protectedStatus: "LOCKED", recordsIntact: true },
      created_at: new Date(now - 1e3 * 60 * 5).toISOString()
    });
  }
  // --- Feature F: Emergency Pause Controls ---
  getEmergencyPauseState() {
    return { ...this.emergencyPauseState };
  }
  setEmergencyPause(pause, operator = "SecOps Admin", reason = "Administrative emergency command") {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    this.emergencyPauseState = {
      isPaused: pause,
      pausedAt: pause ? nowIso : null,
      pausedBy: pause ? operator : null,
      reason: pause ? reason : null
    };
    const auditId = generateId("AUD-KILL");
    this.auditEvents.unshift({
      id: auditId,
      action_id: generateId("ACT-KILL"),
      agent_id: operator,
      tool: "gateway_control",
      operation: pause ? "emergency_pause_activate" : "emergency_pause_resume",
      resource: "global_gateway_runtime",
      description: `Emergency Kill Switch ${pause ? "ACTIVATED" : "RESUMED"} by ${operator}: ${reason}`,
      decision: pause ? "BLOCK" : "ALLOW",
      reason: `Administrative kill switch state transition: ${pause ? "HARD STOP" : "RESUME"}`,
      execution_status: "EXECUTED",
      security_signals: { emergencyPaused: pause },
      created_at: nowIso
    });
    return { ...this.emergencyPauseState };
  }
  // --- Feature C & D: Policies & Alerts Accessors ---
  getPolicies() {
    return policyEngine.getPolicies();
  }
  togglePolicy(id) {
    return policyEngine.togglePolicy(id);
  }
  getPolicyConflicts() {
    return policyEngine.getConflicts();
  }
  getAlerts() {
    return anomalyDetector.getAlerts();
  }
  resolveAlert(id) {
    return anomalyDetector.resolveAlert(id);
  }
  // --- Feature E: Approvals with Expiry Check ---
  getApprovals() {
    const now = Date.now();
    this.approvals.forEach((app2) => {
      if (app2.status === "PENDING" && new Date(app2.expires_at).getTime() < now) {
        app2.status = "EXPIRED";
        app2.execution_result = { expired: true, reason: "Time-to-live expired prior to supervisor authorization" };
      }
    });
    return [...this.approvals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  getAuditEvents() {
    return [...this.auditEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  getMockResources() {
    return {
      catalogue: mockResourceStore.getCatalogue(),
      financialRecords: mockResourceStore.getFinancialRecords(),
      customerDossiers: mockResourceStore.getCustomerDossiers()
    };
  }
  /**
   * Complete 10-Step Deterministic Gateway Evaluation Pipeline
   */
  evaluateAction(payload) {
    const actionId = generateId("ACT");
    const auditId = generateId("AUD");
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const agentId = payload.agent_id || "agent-default-worker";
    if (this.emergencyPauseState.isPaused) {
      const reason2 = `CRITICAL HALT: Emergency Agent Pause is actively engaged (${this.emergencyPauseState.reason || "Manual override"}). All tool operations hard-stopped.`;
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || "Action denied by Emergency Kill Switch",
        decision: "BLOCK",
        reason: reason2,
        execution_status: "BLOCKED",
        security_signals: { emergencyPaused: true },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);
      return {
        success: false,
        decision: "BLOCK",
        reason: reason2,
        actionId,
        agentId,
        executionStatus: "BLOCKED",
        securitySignals: { emergencyPaused: true }
      };
    }
    const untrustedContent = payload.untrusted_document || payload.description || "";
    const injectionResult = promptInjectionScanner.scan(untrustedContent);
    if (injectionResult.detected) {
      const reason2 = `Active Prompt Injection Signature Flagged: ${injectionResult.explanation} (Matched: "${injectionResult.matchedPattern}"). Action intercepted and untrusted document neutralized.`;
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason2);
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || "Untrusted document with prompt injection",
        decision: "BLOCK",
        reason: reason2,
        execution_status: "BLOCKED",
        security_signals: {
          promptInjection: injectionResult,
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);
      return {
        success: false,
        decision: "BLOCK",
        reason: reason2,
        actionId,
        agentId,
        executionStatus: "BLOCKED",
        securitySignals: {
          promptInjection: injectionResult,
          anomalyAlert: anomalyAlert || void 0
        }
      };
    }
    const leakPolicy = payload.leak_policy || "BLOCK";
    const ingressLeakResult = sensitiveDataScanner.scan(payload.parameters, leakPolicy);
    if (ingressLeakResult.detected && leakPolicy === "BLOCK") {
      const reason2 = `Outbound Data Leak Prohibited: ${ingressLeakResult.summary} (Found ${ingressLeakResult.findings.length} secret token(s)). Execution terminated before external transmission.`;
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason2);
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || "Outbound payload with sensitive secrets",
        decision: "BLOCK",
        reason: reason2,
        execution_status: "BLOCKED",
        execution_output: {
          containment: "BLOCKED_AT_SENSITIVE_DATA_SCANNER",
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
        decision: "BLOCK",
        reason: reason2,
        actionId,
        agentId,
        executionStatus: "BLOCKED",
        securitySignals: {
          sensitiveLeak: ingressLeakResult,
          anomalyAlert: anomalyAlert || void 0
        }
      };
    }
    const evalResult = policyEngine.evaluate(payload);
    const { decision, reason, conflict } = evalResult;
    if (conflict) {
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || "Policy conflict on scope",
        decision: "BLOCK",
        reason,
        execution_status: "BLOCKED",
        security_signals: {
          policyConflict: conflict,
          anomalyDetected: !!anomalyAlert
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);
      return {
        success: false,
        decision: "BLOCK",
        reason,
        actionId,
        agentId,
        executionStatus: "BLOCKED",
        securitySignals: {
          policyConflict: conflict,
          anomalyAlert: anomalyAlert || void 0
        }
      };
    }
    if (decision === "ALLOW") {
      const execResult = mockResourceStore.executeMockAction(
        payload.tool,
        payload.operation,
        payload.resource,
        ingressLeakResult.detected && leakPolicy === "REDACT" ? ingressLeakResult.sanitizedData : payload.parameters
      );
      const egressLeak = sensitiveDataScanner.scan(execResult.output, leakPolicy);
      const finalOutput = egressLeak.detected && leakPolicy === "REDACT" ? egressLeak.sanitizedData : execResult.output;
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Executed ${payload.operation} on ${payload.resource}`,
        decision: "ALLOW",
        reason,
        execution_status: execResult.success ? "EXECUTED" : "FAILED",
        execution_output: finalOutput,
        security_signals: {
          sensitiveLeak: egressLeak.detected ? egressLeak : void 0
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);
      return {
        success: true,
        decision: "ALLOW",
        reason,
        actionId,
        agentId,
        executionStatus: "EXECUTED",
        executionOutput: finalOutput,
        securitySignals: {
          sensitiveLeak: egressLeak.detected ? egressLeak : void 0
        }
      };
    }
    if (decision === "BLOCK") {
      const anomalyAlert = anomalyDetector.recordBlockedAttempt(agentId, reason);
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Attempted ${payload.operation} on ${payload.resource}`,
        decision: "BLOCK",
        reason,
        execution_status: "BLOCKED",
        execution_output: {
          containment: "BLOCKED_AT_INGRESS_GATEWAY",
          sideEffects: "NONE",
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
        decision: "BLOCK",
        reason,
        actionId,
        agentId,
        executionStatus: "BLOCKED",
        executionOutput: { protected: true, modified: false },
        securitySignals: {
          anomalyAlert: anomalyAlert || void 0
        }
      };
    }
    if (decision === "REQUIRE_APPROVAL") {
      const approvalId = generateId("APR");
      const ttlMinutes = payload.parameters?.ttlMinutes ? parseInt(payload.parameters.ttlMinutes, 10) : 10;
      const ttlMs = ttlMinutes * 60 * 1e3;
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();
      const approvalRequest = {
        id: approvalId,
        action_payload: { ...payload, agent_id: agentId },
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
        created_at: nowIso,
        expires_at: expiresAt
      };
      this.approvals.unshift(approvalRequest);
      const auditEvent = {
        id: auditId,
        action_id: actionId,
        agent_id: agentId,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: payload.description || `Pending human approval for ${payload.operation} on ${payload.resource}`,
        decision: "REQUIRE_APPROVAL",
        reason,
        execution_status: "PENDING_APPROVAL",
        execution_output: {
          approvalId,
          queuedAt: nowIso,
          expiresAt,
          quarantineState: "PAUSED_PENDING_SUPERVISOR"
        },
        created_at: nowIso
      };
      this.auditEvents.unshift(auditEvent);
      return {
        success: true,
        decision: "REQUIRE_APPROVAL",
        reason: `${reason} (Approval expires in ${ttlMinutes}m)`,
        actionId,
        agentId,
        executionStatus: "PENDING_APPROVAL",
        approvalId
      };
    }
    return {
      success: false,
      decision: "BLOCK",
      reason: "Unknown security state encountered.",
      actionId,
      agentId,
      executionStatus: "FAILED"
    };
  }
  /**
   * Supervisor Approval / Rejection Processor
   * Server-side authorization, auto-expiry validation & replay prevention
   */
  processApprovalDecision(approvalId, decisionType, reviewer = "SecOps Supervisor") {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) {
      return {
        success: false,
        approval: null,
        message: `Approval request '${approvalId}' not found.`,
        executionStatus: "FAILED"
      };
    }
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    if (new Date(approval.expires_at).getTime() < now) {
      approval.status = "EXPIRED";
      approval.reviewed_at = nowIso;
      approval.reviewed_by = reviewer;
      approval.execution_result = { expired: true, reason: "Approval validity window has lapsed" };
      const auditId2 = generateId("AUD-EXP");
      this.auditEvents.unshift({
        id: auditId2,
        action_id: generateId("ACT-EXP"),
        agent_id: approval.action_payload.agent_id,
        tool: approval.action_payload.tool,
        operation: approval.action_payload.operation,
        resource: approval.action_payload.resource,
        description: `Approval EXPIRED prior to execution: ${approval.action_payload.description || ""}`,
        decision: "REQUIRE_APPROVAL",
        reason: `Server-side Expiry Verification: Request '${approvalId}' expired at ${approval.expires_at}. Execution denied.`,
        execution_status: "EXPIRED",
        execution_output: { approvalId, status: "EXPIRED", executed: false },
        created_at: nowIso
      });
      return {
        success: false,
        approval,
        message: `Execution Denied: Approval request '${approvalId}' expired at ${new Date(approval.expires_at).toLocaleTimeString()}. Expired approvals cannot authorize actions.`,
        executionStatus: "EXPIRED"
      };
    }
    if (approval.status !== "PENDING") {
      return {
        success: false,
        approval,
        message: `Security violation: Approval '${approvalId}' was already resolved as ${approval.status}. Replay attack prevented.`,
        executionStatus: "FAILED"
      };
    }
    if (this.emergencyPauseState.isPaused) {
      return {
        success: false,
        approval,
        message: `Execution Denied: Emergency Agent Pause is actively engaged. All executions are frozen.`,
        executionStatus: "FAILED"
      };
    }
    approval.reviewed_at = nowIso;
    approval.reviewed_by = reviewer;
    const payload = approval.action_payload;
    const auditId = generateId("AUD");
    const actionId = generateId("ACT-EXEC");
    if (decisionType === "REJECT") {
      approval.status = "REJECTED";
      approval.execution_result = { rejected: true, reason: "Rejected by security supervisor" };
      this.auditEvents.unshift({
        id: auditId,
        action_id: actionId,
        agent_id: payload.agent_id,
        tool: payload.tool,
        operation: payload.operation,
        resource: payload.resource,
        description: `Approval REJECTED by ${reviewer}: ${payload.description || ""}`,
        decision: "REQUIRE_APPROVAL",
        reason: `Supervisor ${reviewer} rejected execution of quarantined action.`,
        execution_status: "REJECTED",
        execution_output: { approvalId, status: "REJECTED", executed: false },
        created_at: nowIso
      });
      return {
        success: true,
        approval,
        message: "Action was rejected by supervisor. Operation was terminated without execution.",
        executionStatus: "REJECTED"
      };
    }
    approval.status = "APPROVED";
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
      description: `Approval VERIFIED & EXECUTED by ${reviewer}: ${payload.description || ""}`,
      decision: "REQUIRE_APPROVAL",
      reason: `Authorized by ${reviewer}. Restrictive policy condition verified.`,
      execution_status: execResult.success ? "EXECUTED" : "FAILED",
      execution_output: execResult.output,
      created_at: nowIso
    });
    return {
      success: true,
      approval,
      message: execResult.message,
      executionStatus: execResult.success ? "EXECUTED" : "FAILED",
      output: execResult.output
    };
  }
  getStats() {
    const total = this.auditEvents.length;
    const allowed = this.auditEvents.filter((e) => e.decision === "ALLOW").length;
    const blocked = this.auditEvents.filter((e) => e.decision === "BLOCK").length;
    const pending = this.approvals.filter((a) => a.status === "PENDING").length;
    const approved = this.approvals.filter((a) => a.status === "APPROVED").length;
    const rejected = this.approvals.filter((a) => a.status === "REJECTED").length;
    const intercepted = blocked + pending + rejected;
    const containmentRate = total > 0 ? Math.round(intercepted / total * 100) : 100;
    const leaksBlocked = this.auditEvents.filter((e) => e.security_signals?.sensitiveLeak?.detected).length;
    const injectionsDetected = this.auditEvents.filter((e) => e.security_signals?.promptInjection?.detected).length;
    const conflictsCount = this.getPolicyConflicts().length;
    return {
      totalActions: total,
      allowedCount: allowed,
      blockedCount: blocked,
      pendingApprovalCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      containmentRate,
      activePoliciesCount: policyEngine.getPolicies().filter((p) => p.enabled).length,
      activeAlertsCount: anomalyDetector.getActiveAlertsCount(),
      policyConflictsCount: conflictsCount,
      emergencyPaused: this.emergencyPauseState.isPaused,
      sensitiveLeaksBlockedCount: leaksBlocked,
      injectionsDetectedCount: injectionsDetected,
      lastInterceptAt: this.auditEvents[0]?.created_at
    };
  }
  resetDemo() {
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
};
var securityGatewayService = new SecurityGatewayService();

// server/routes/api.ts
var apiRouter = Router();
apiRouter.post("/actions/evaluate", (req, res) => {
  try {
    const {
      tool,
      operation,
      resource,
      description,
      parameters,
      agent_id,
      untrusted_document,
      leak_policy
    } = req.body || {};
    if (!tool || !operation || !resource) {
      res.status(400).json({
        success: false,
        decision: "BLOCK",
        reason: "Validation failure: tool, operation, and resource fields are required.",
        actionId: "ERR-" + Date.now().toString(36),
        executionStatus: "BLOCKED"
      });
      return;
    }
    const result = securityGatewayService.evaluateAction({
      tool,
      operation,
      resource,
      description,
      parameters,
      agent_id,
      untrusted_document,
      leak_policy
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      decision: "BLOCK",
      reason: "Server error during policy evaluation: " + (error?.message || "Unknown"),
      actionId: "ERR-500",
      executionStatus: "FAILED"
    });
  }
});
apiRouter.get("/policies", (_req, res) => {
  try {
    const policies = securityGatewayService.getPolicies();
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/policy-conflicts", (_req, res) => {
  try {
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, conflicts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.patch("/policies/:id/toggle", (req, res) => {
  try {
    const updated = securityGatewayService.togglePolicy(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, message: "Policy not found" });
      return;
    }
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, policy: updated, conflicts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/approvals", (_req, res) => {
  try {
    const approvals = securityGatewayService.getApprovals();
    res.json({ success: true, approvals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/approvals/:id/decision", (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reviewer } = req.body || {};
    if (decision !== "APPROVE" && decision !== "REJECT") {
      res.status(400).json({
        success: false,
        message: "Invalid decision: Must be either APPROVE or REJECT"
      });
      return;
    }
    const result = securityGatewayService.processApprovalDecision(id, decision, reviewer);
    const statusCode = result.success ? 200 : result.message.includes("not found") ? 404 : 409;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/approvals/:id/simulate-expiry", (req, res) => {
  try {
    const { id } = req.params;
    const approvals = securityGatewayService.getApprovals();
    const target = approvals.find((a) => a.id === id);
    if (!target) {
      res.status(404).json({ success: false, message: "Approval not found" });
      return;
    }
    target.expires_at = new Date(Date.now() - 6e4).toISOString();
    target.status = "EXPIRED";
    res.json({ success: true, message: `Approval ${id} validity has expired.`, approval: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/alerts", (_req, res) => {
  try {
    const alerts = securityGatewayService.getAlerts();
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/alerts/:id/resolve", (req, res) => {
  try {
    const success = securityGatewayService.resolveAlert(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: "Alert not found" });
      return;
    }
    res.json({ success: true, message: "Alert marked as RESOLVED" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/emergency-pause", (_req, res) => {
  try {
    const pauseState = securityGatewayService.getEmergencyPauseState();
    res.json({
      success: true,
      pauseState,
      isPaused: pauseState.isPaused,
      paused: pauseState.isPaused
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/emergency-pause/toggle", (req, res) => {
  try {
    const { pause, operator, reason } = req.body || {};
    const updated = securityGatewayService.setEmergencyPause(
      !!pause,
      operator || "SecOps Admin",
      reason || (pause ? "Emergency halt ordered by administrator" : "Resumed by administrator")
    );
    res.json({ success: true, pauseState: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/audit", (_req, res) => {
  try {
    const auditEvents = securityGatewayService.getAuditEvents();
    res.json({ success: true, events: auditEvents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/stats", (_req, res) => {
  try {
    const stats = securityGatewayService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/resources", (_req, res) => {
  try {
    const resources = securityGatewayService.getMockResources();
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/reset", (_req, res) => {
  try {
    securityGatewayService.resetDemo();
    res.json({ success: true, message: "Demo environment reset to baseline state." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/app.ts
var app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json());
var healthHandler = (_req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    service: "SENTRIX AI Agent Security Gateway",
    version: "1.0.0-hackathon",
    engine: "Deterministic Deny-By-Default Policy Engine",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.use("/api", apiRouter);
app.use(apiRouter);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: `API endpoint ${req.method} ${req.originalUrl || req.url} was not found on SENTRIX gateway.`
  });
});
app.use((err, _req, res, _next) => {
  console.error("[SENTRIX Gateway Internal Error]", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || "INTERNAL_SERVER_ERROR",
    message: err.message || "An internal error occurred on the security gateway."
  });
});
var app_default = app;
export {
  app,
  app_default as default
};

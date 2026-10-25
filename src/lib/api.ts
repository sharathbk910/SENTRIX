import {
  ActionPayload,
  ApprovalRequest,
  AuditEvent,
  BehaviorAnomalyAlert,
  EmergencyPauseState,
  EvaluationResponse,
  MockResources,
  Policy,
  PolicyConflictWarning,
  SystemStats,
  PolicyTranslationResult,
  IntegrityVerificationResult,
  AttackDemoExecution
} from '../types';

/**
 * Custom Error for API interactions providing structured HTTP status and diagnostic metadata
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;
  public readonly responseSnippet?: string;
  public readonly isHtmlError: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    responseSnippet?: string,
    isHtmlError = false,
    code?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.responseSnippet = responseSnippet;
    this.isHtmlError = isHtmlError;
    this.code = code;
  }
}

import { config } from '../config/env';

/**
 * Resolve the API base URL from centralized configuration.
 * - Defaults to same-origin '/api' (standard for Vercel Serverless and Vite local proxy).
 * - Can be overridden via VITE_API_URL for separate standalone backend services.
 */
export function getApiBaseUrl(): string {
  return config.apiUrl;
}

/**
 * Builds a normalized API request URL, preventing double slashes and duplicate '/api' prefixes.
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${base}${cleanPath.substring(4)}`;
  }
  return `${base}${cleanPath}`;
}

/**
 * Centralized, type-safe HTTP client for the SENTRIX security gateway.
 * - Enforces JSON content-type and checks HTTP response status before resolving.
 * - Detects and reports HTML error pages from hosting platforms (e.g. Vercel unrouted 404s).
 * - Removes hardcoded production fallbacks to localhost:3001.
 * - Never returns fabricated demo data for failed production requests.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError: any) {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const diagnostic = isLocalhost
      ? `Network connection to SENTRIX gateway at ${url} failed. Ensure the local server is running on port 3001 ('npm run server').`
      : `Network connection to SENTRIX gateway at ${url} failed. Verify service availability and CORS configuration.`;

    throw new ApiClientError(diagnostic, 0, 'NetworkError', url);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (res.status === 204) {
    return {} as T;
  }

  let parsedBody: any = null;
  let rawText = '';

  try {
    rawText = await res.text();
    if (isJson && rawText.trim().length > 0) {
      parsedBody = JSON.parse(rawText);
    }
  } catch (parseError: any) {
    const isHtml =
      rawText.includes('<html') ||
      rawText.includes('<!DOCTYPE') ||
      rawText.includes('404: NOT_FOUND') ||
      rawText.startsWith('The page could not be found');

    const diagnostic = isHtml
      ? `Gateway returned an HTML page instead of JSON (HTTP ${res.status} ${res.statusText}). This indicates an unrouted path or missing serverless handler on the host.`
      : `Failed to parse response from ${url} as JSON: ${parseError.message}`;

    throw new ApiClientError(
      diagnostic,
      res.status,
      res.statusText,
      url,
      rawText.slice(0, 300),
      isHtml
    );
  }

  // Handle HTTP error statuses
  if (!res.ok) {
    const serverMessage = parsedBody?.message || parsedBody?.error || parsedBody?.reason;
    const message = serverMessage
      ? `Gateway Error (${res.status}): ${serverMessage}`
      : `HTTP ${res.status} ${res.statusText} from ${url}`;

    throw new ApiClientError(
      message,
      res.status,
      res.statusText,
      url,
      rawText.slice(0, 300),
      false,
      parsedBody?.error
    );
  }

  // If status is ok but no JSON parsed and response body was expected
  if (!parsedBody && rawText.trim().length > 0) {
    throw new ApiClientError(
      `Gateway at ${url} returned non-JSON content: ${rawText.slice(0, 150)}`,
      res.status,
      res.statusText,
      url,
      rawText.slice(0, 300)
    );
  }

  return (parsedBody || {}) as T;
}

export const api = {
  // Evaluates proposed action through 10-step security gateway pipeline
  evaluateAction: async (payload: ActionPayload): Promise<EvaluationResponse> => {
    return request<EvaluationResponse>('/actions/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Policies & Plain-English Builder (Feature 3)
  getPolicies: async (): Promise<{ success: boolean; policies: Policy[] }> => {
    return request<{ success: boolean; policies: Policy[] }>('/policies');
  },

  translatePolicy: async (input: string): Promise<PolicyTranslationResult> => {
    return request<PolicyTranslationResult>('/policies/translate', {
      method: 'POST',
      body: JSON.stringify({ input })
    });
  },

  createPolicy: async (
    policy: Omit<Policy, 'id' | 'created_at'>
  ): Promise<{
    success: boolean;
    policy: Policy;
    conflicts?: PolicyConflictWarning[];
    conflict?: PolicyConflictWarning;
  }> => {
    return request('/policies', {
      method: 'POST',
      body: JSON.stringify(policy)
    });
  },

  deletePolicy: async (
    id: string
  ): Promise<{ success: boolean; message: string; conflicts?: PolicyConflictWarning[] }> => {
    return request(`/policies/${id}`, {
      method: 'DELETE'
    });
  },

  getPolicyConflicts: async (): Promise<{ success: boolean; conflicts: PolicyConflictWarning[] }> => {
    return request<{ success: boolean; conflicts: PolicyConflictWarning[] }>('/policy-conflicts');
  },

  togglePolicy: async (
    id: string
  ): Promise<{ success: boolean; policy: Policy; conflicts?: PolicyConflictWarning[] }> => {
    return request<{ success: boolean; policy: Policy; conflicts?: PolicyConflictWarning[] }>(
      `/policies/${id}/toggle`,
      { method: 'PATCH' }
    );
  },

  // Approvals & Expiry (Feature 4)
  getApprovals: async (): Promise<{ success: boolean; approvals: ApprovalRequest[] }> => {
    return request<{ success: boolean; approvals: ApprovalRequest[] }>('/approvals');
  },

  submitApprovalDecision: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reviewer = 'SecOps Supervisor',
    rejectionReason?: string
  ): Promise<{
    success: boolean;
    approval: ApprovalRequest | null;
    message: string;
    executionStatus: 'EXECUTED' | 'REJECTED' | 'FAILED' | 'EXPIRED';
    output?: any;
  }> => {
    return request(`/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewer, rejectionReason })
    });
  },

  simulateApprovalExpiry: async (
    id: string
  ): Promise<{ success: boolean; message: string; approval: ApprovalRequest }> => {
    return request(`/approvals/${id}/simulate-expiry`, {
      method: 'POST'
    });
  },

  // Anomaly Alerts
  getAlerts: async (): Promise<{ success: boolean; alerts: BehaviorAnomalyAlert[] }> => {
    return request<{ success: boolean; alerts: BehaviorAnomalyAlert[] }>('/alerts');
  },

  resolveAlert: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/alerts/${id}/resolve`, {
      method: 'POST'
    });
  },

  // Emergency Pause / Kill Switch
  getEmergencyPause: async (): Promise<{ success: boolean; pauseState: EmergencyPauseState }> => {
    return request<{ success: boolean; pauseState: EmergencyPauseState }>('/emergency-pause');
  },

  toggleEmergencyPause: async (
    pause: boolean,
    operator = 'SecOps Admin',
    reason = 'Admin emergency command'
  ): Promise<{ success: boolean; pauseState: EmergencyPauseState }> => {
    return request<{ success: boolean; pauseState: EmergencyPauseState }>(
      '/emergency-pause/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ pause, operator, reason })
      }
    );
  },

  // Tamper-Evident Audit Logs & Verification (Feature 5)
  getAuditEvents: async (): Promise<{ success: boolean; events: AuditEvent[] }> => {
    return request<{ success: boolean; events: AuditEvent[] }>('/audit');
  },

  verifyAuditIntegrity: async (): Promise<{
    success: boolean;
    verification: IntegrityVerificationResult;
  }> => {
    return request<{ success: boolean; verification: IntegrityVerificationResult }>('/audit/verify');
  },

  simulateAuditTamper: async (
    eventId?: string
  ): Promise<{ success: boolean; message: string; result: any }> => {
    return request('/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
  },

  // Live Attack Demonstration (Feature 1)
  getAttackScenario: async (): Promise<{ success: boolean; scenario: any }> => {
    return request('/attack-demo/scenario');
  },

  runAttackDemo: async (): Promise<{
    success: boolean;
    execution: AttackDemoExecution;
  }> => {
    return request('/attack-demo/run', {
      method: 'POST'
    });
  },

  // Stats
  getStats: async (): Promise<{ success: boolean; stats: SystemStats }> => {
    return request<{ success: boolean; stats: SystemStats }>('/stats');
  },

  // Mock resources
  getMockResources: async (): Promise<{ success: boolean; resources: MockResources }> => {
    return request<{ success: boolean; resources: MockResources }>('/resources');
  },

  // Reset
  resetDemo: async (): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>('/reset', {
      method: 'POST'
    });
  },

  // Health check
  checkHealth: async (): Promise<{ status: string; service: string }> => {
    return request<{ status: string; service: string }>('/health');
  }
};

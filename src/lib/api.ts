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
  SystemStats
} from '../types';

const API_BASE = ((import.meta as any).env && (import.meta as any).env.VITE_API_URL) || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`API Request failed on ${url}:`, error);
    if (API_BASE === '/api') {
      try {
        const directUrl = `http://localhost:3001/api${path}`;
        const fallbackRes = await fetch(directUrl, { ...options, headers });
        return await fallbackRes.json();
      } catch (fallbackError) {
        throw error;
      }
    }
    throw error;
  }
}

export const api = {
  // Evaluates proposed action through 10-step security gateway pipeline
  evaluateAction: async (payload: ActionPayload): Promise<EvaluationResponse> => {
    return request<EvaluationResponse>('/actions/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Policies & Conflicts (Feature D)
  getPolicies: async (): Promise<{ success: boolean; policies: Policy[] }> => {
    return request<{ success: boolean; policies: Policy[] }>('/policies');
  },

  getPolicyConflicts: async (): Promise<{ success: boolean; conflicts: PolicyConflictWarning[] }> => {
    return request<{ success: boolean; conflicts: PolicyConflictWarning[] }>('/policy-conflicts');
  },

  togglePolicy: async (id: string): Promise<{ success: boolean; policy: Policy; conflicts?: PolicyConflictWarning[] }> => {
    return request<{ success: boolean; policy: Policy; conflicts?: PolicyConflictWarning[] }>(`/policies/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  // Approvals & Expiry (Feature E)
  getApprovals: async (): Promise<{ success: boolean; approvals: ApprovalRequest[] }> => {
    return request<{ success: boolean; approvals: ApprovalRequest[] }>('/approvals');
  },

  submitApprovalDecision: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reviewer = 'SecOps Supervisor'
  ): Promise<{
    success: boolean;
    approval: ApprovalRequest | null;
    message: string;
    executionStatus: 'EXECUTED' | 'REJECTED' | 'FAILED' | 'EXPIRED';
    output?: any;
  }> => {
    return request(`/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewer })
    });
  },

  simulateApprovalExpiry: async (id: string): Promise<{ success: boolean; message: string; approval: ApprovalRequest }> => {
    return request(`/approvals/${id}/simulate-expiry`, {
      method: 'POST'
    });
  },

  // Anomaly Alerts (Feature C)
  getAlerts: async (): Promise<{ success: boolean; alerts: BehaviorAnomalyAlert[] }> => {
    return request<{ success: boolean; alerts: BehaviorAnomalyAlert[] }>('/alerts');
  },

  resolveAlert: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/alerts/${id}/resolve`, {
      method: 'POST'
    });
  },

  // Emergency Pause / Kill Switch (Feature F)
  getEmergencyPause: async (): Promise<{ success: boolean; pauseState: EmergencyPauseState }> => {
    return request<{ success: boolean; pauseState: EmergencyPauseState }>('/emergency-pause');
  },

  toggleEmergencyPause: async (
    pause: boolean,
    operator = 'SecOps Admin',
    reason = 'Admin emergency command'
  ): Promise<{ success: boolean; pauseState: EmergencyPauseState }> => {
    return request<{ success: boolean; pauseState: EmergencyPauseState }>('/emergency-pause/toggle', {
      method: 'POST',
      body: JSON.stringify({ pause, operator, reason })
    });
  },

  // Audit Logs
  getAuditEvents: async (): Promise<{ success: boolean; events: AuditEvent[] }> => {
    return request<{ success: boolean; events: AuditEvent[] }>('/audit');
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
  }
};

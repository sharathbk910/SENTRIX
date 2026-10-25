import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import { DecisionBadge, ExecutionBadge, RiskBadge } from '../components/common/Badge';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Hourglass,
  TimerOff,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  FileKey,
  Terminal,
  Lock,
  User,
  MessageSquare
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface ApprovalsProps {
  approvals: ApprovalRequest[];
  onDecision: (id: string, decision: 'APPROVE' | 'REJECT', reviewer?: string, rejectionReason?: string) => Promise<void>;
  onSimulateExpiry: (id: string) => Promise<void>;
  onRouteChange: (route: RouteId) => void;
  onGenerateSampleApproval?: () => Promise<void>;
  isLoading: boolean;
  emergencyPaused?: boolean;
}

export const Approvals: React.FC<ApprovalsProps> = ({
  approvals,
  onDecision,
  onSimulateExpiry,
  onRouteChange,
  onGenerateSampleApproval,
  isLoading,
  emergencyPaused = false
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED' | 'EXPIRED'>('PENDING');
  const [reviewerName, setReviewerName] = useState('SecOps Supervisor (Tier-2 Clearance)');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const pendingList = approvals.filter((a) => a.status === 'PENDING');
  const resolvedList = approvals.filter((a) => a.status === 'APPROVED' || a.status === 'REJECTED');
  const expiredList = approvals.filter((a) => a.status === 'EXPIRED');

  const currentList =
    activeTab === 'PENDING'
      ? pendingList
      : activeTab === 'RESOLVED'
      ? resolvedList
      : expiredList;

  const handleApprove = async (id: string) => {
    setSubmittingId(id);
    try {
      await onDecision(id, 'APPROVE', reviewerName);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setSubmittingId(rejectingId);
    try {
      await onDecision(
        rejectingId,
        'REJECT',
        reviewerName,
        rejectionReasonInput.trim() || 'Action denied by SecOps Supervisor.'
      );
      setRejectingId(null);
      setRejectionReasonInput('');
    } finally {
      setSubmittingId(null);
    }
  };

  const formatExpiryTime = (iso: string) => {
    try {
      const exp = new Date(iso);
      const diffMs = exp.getTime() - Date.now();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMs <= 0) return 'Expired';
      return `Expires in ~${diffMin}m (${exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop Clearance</span>
          </div>
          <h1 className="text-2xl font-serif text-white tracking-tight font-normal">
            Quarantine &amp; Approval Governance Queue
          </h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Authorize or reject restricted autonomous tool requests. Enforces cryptographic action parameter binding, server-side auto-expiry windows, and replay prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onGenerateSampleApproval && (
            <button
              onClick={async () => {
                await onGenerateSampleApproval();
                setActiveTab('PENDING');
              }}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-[6px] bg-[#040406] hover:bg-[#17181F] border border-[#CC9166]/30 text-[#CC9166] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#CC9166]" />
              <span>+ Sample Approval Request</span>
            </button>
          )}

          {/* Tab Toggle */}
          <div className="flex p-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs font-medium">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending ({pendingList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RESOLVED')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'RESOLVED'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resolved ({resolvedList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('EXPIRED')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'EXPIRED'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <TimerOff className="w-3.5 h-3.5 text-[#9194A1]" />
              <span>Expired ({expiredList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviewer Identity Selector */}
      <div className="enterprise-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-[#CC9166] shrink-0" />
          <div>
            <span className="font-medium text-white">Active Reviewer Persona:</span>
            <p className="text-[11px] text-[#9194A1]">Reviewer identity attached to governance audit decisions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="px-3 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs font-mono focus:outline-none focus:border-[#CC9166] w-64"
            placeholder="Reviewer name / clearance"
          />
        </div>
      </div>

      {/* Emergency Stop Guardrail Alert */}
      {emergencyPaused && (
        <div className="p-3.5 rounded-[10px] bg-rose-500/[0.08] border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Emergency Stop Active:</strong> Approval decisions are halted while the gateway emergency pause is engaged. All executions remain frozen.
          </span>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="enterprise-card p-12 text-center space-y-3">
            <UserCheck className="w-8 h-8 text-[#9194A1]/40 mx-auto" />
            <h3 className="text-sm font-serif text-[#C7C9D1]">
              No {activeTab.toLowerCase()} approval requests
            </h3>
            <p className="text-xs text-[#9194A1] max-w-sm mx-auto leading-relaxed">
              {activeTab === 'PENDING'
                ? 'All proposed agent operations are currently resolved or operating within permissive policy limits.'
                : 'No historical requests found in this classification category.'}
            </p>
          </div>
        ) : (
          currentList.map((app) => {
            const isPending = app.status === 'PENDING';
            const isSubmitting = submittingId === app.id;

            return (
              <div
                key={app.id}
                className="enterprise-card p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1D22] pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold text-amber-400 bg-amber-500/[0.08] px-2 py-0.5 rounded-[4px] border border-amber-500/30">
                      {app.id}
                    </span>
                    <span className="text-xs font-mono text-[#E2E3E9] font-medium">
                      Agent: {app.action_payload.agent_id}
                    </span>
                    <ExecutionBadge
                      status={
                        app.status === 'PENDING'
                          ? 'PENDING_APPROVAL'
                          : app.status === 'APPROVED'
                          ? 'EXECUTED'
                          : app.status
                      }
                      size="sm"
                    />
                    <RiskBadge score={app.risk_score || 75} level={app.risk_level} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#9194A1]">
                    <Clock className="w-3.5 h-3.5 text-[#9194A1]" />
                    <span>Requested: {new Date(app.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Main Action Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                    <span className="text-[10px] font-mono text-[#9194A1] uppercase">Proposed Operation</span>
                    <div className="font-mono text-[#CC9166] font-semibold text-xs">
                      {app.action_payload.tool}:{app.action_payload.operation}
                    </div>
                  </div>

                  <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                    <span className="text-[10px] font-mono text-[#9194A1] uppercase">Target Resource</span>
                    <div className="font-mono text-[#E2E3E9] text-xs truncate" title={app.action_payload.resource}>
                      {app.action_payload.resource}
                    </div>
                  </div>

                  <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                    <span className="text-[10px] font-mono text-[#9194A1] uppercase">Expiry Status (TTL)</span>
                    <div className="font-mono text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatExpiryTime(app.expires_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Intent & Matched Policy */}
                <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#9194A1] text-[11px] font-mono">
                    <span>Policy Trigger: {app.matched_policy_id || 'POL-003'} ({app.matched_policy_name || 'Confidential Dossier Transfer Approval'})</span>
                    <span className="text-amber-400 font-medium">Quarantine Gate Enforced</span>
                  </div>
                  <p className="text-[#C7C9D1] font-sans leading-relaxed">
                    {app.action_payload.description || 'Autonomous agent proposed restricted operation requiring human sign-off.'}
                  </p>
                </div>

                {/* Parameters bound to approval */}
                {app.action_payload.parameters && Object.keys(app.action_payload.parameters).length > 0 && (
                  <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs space-y-1">
                    <span className="text-[10px] font-mono text-[#9194A1] uppercase">Bound Action Parameters (Immutable):</span>
                    <pre className="font-mono text-[11px] text-[#C7C9D1] overflow-x-auto">
                      {JSON.stringify(app.action_payload.parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {/* If already resolved or expired */}
                {!isPending && (
                  <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[#9194A1] font-mono text-[11px]">
                      <span>Reviewed by: {app.reviewed_by || 'SecOps Supervisor'}</span>
                      <span>Decided at: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    {app.rejection_reason && (
                      <p className="text-rose-400 font-sans">
                        Rejection Rationale: {app.rejection_reason}
                      </p>
                    )}
                    {app.execution_result && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-[#9194A1] uppercase">Execution Result:</span>
                        <pre className="font-mono text-[11px] text-emerald-300 mt-1">
                          {JSON.stringify(app.execution_result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons if Pending */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1C1D22]">
                    <button
                      type="button"
                      onClick={() => onSimulateExpiry(app.id)}
                      disabled={isLoading || isSubmitting}
                      className="text-xs text-[#9194A1] hover:text-amber-300 font-mono flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Demonstrates server-side auto-expiry without waiting 10 minutes"
                    >
                      <TimerOff className="w-3.5 h-3.5" />
                      <span>Simulate Instant Expiry (Demo)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(app.id);
                          setRejectionReasonInput('');
                        }}
                        disabled={isLoading || isSubmitting || emergencyPaused}
                        className="px-4 py-1.5 rounded-[6px] bg-[#040406] hover:bg-rose-950/40 text-[#9194A1] hover:text-rose-400 border border-[#1C1D22] hover:border-rose-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(app.id)}
                        disabled={isLoading || isSubmitting || emergencyPaused}
                        className="px-4 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Authorizing...' : 'Authorize & Execute'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-[#1C1D22] rounded-[10px] p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-2">
              <h3 className="text-base font-serif text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject Quarantined Action</span>
              </h3>
              <button
                onClick={() => setRejectingId(null)}
                className="text-[#9194A1] hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[#C7C9D1] font-medium">Rejection Rationale / Compliance Justification:</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Provide an audit rationale for denying this request..."
                className="w-full p-2.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1D22]">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 rounded-[6px] text-xs text-[#9194A1] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

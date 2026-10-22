import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Hourglass,
  TimerOff,
  ArrowRight
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface ApprovalsProps {
  approvals: ApprovalRequest[];
  onDecision: (id: string, decision: 'APPROVE' | 'REJECT', reviewer?: string) => Promise<void>;
  onSimulateExpiry: (id: string) => Promise<void>;
  onRouteChange: (route: RouteId) => void;
  isLoading: boolean;
}

export const Approvals: React.FC<ApprovalsProps> = ({
  approvals,
  onDecision,
  onSimulateExpiry,
  onRouteChange,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED' | 'EXPIRED'>('PENDING');
  const [reviewerName, setReviewerName] = useState('SecOps Supervisor');

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
    await onDecision(id, 'APPROVE', reviewerName);
  };

  const handleReject = async (id: string) => {
    await onDecision(id, 'REJECT', reviewerName);
  };

  const formatExpiryTime = (iso: string) => {
    try {
      const exp = new Date(iso);
      const diffMin = Math.round((exp.getTime() - Date.now()) / 60000);
      if (diffMin <= 0) return 'Expired';
      return `Expires in ~${diffMin}m (${exp.toLocaleTimeString()})`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Approval Queue</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Human-in-the-loop review for restricted autonomous tool operations. Enforces server-side auto-expiry timestamps and replay attack mitigations.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending ({pendingList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'RESOLVED'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolved ({resolvedList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPIRED')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXPIRED'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TimerOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Expired ({expiredList.length})</span>
          </button>
        </div>
      </div>

      {/* Reviewer Role Banner */}
      <div className="enterprise-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Active Reviewer Identity:</span>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Decisions cryptographically recorded in compliance audit log
        </div>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="enterprise-card p-12 text-center space-y-3">
          <Clock className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">
            {activeTab === 'PENDING'
              ? 'No Pending Actions in Queue'
              : activeTab === 'EXPIRED'
              ? 'No Expired Approvals in Record'
              : 'No Resolved Approvals Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'When an agent requests a restricted operation, it will be quarantined here with a time-to-live expiration.'
              : 'Past approval and rejection records appear here.'}
          </p>
          {activeTab === 'PENDING' && (
            <button
              onClick={() => onRouteChange('playground')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Test Restricted Transfer in Policy Gateway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {currentList.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                      {req.id}
                    </span>
                    <span
                      className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                        req.status === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : req.status === 'EXPIRED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.expires_at && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1">
                        <Hourglass className="w-3 h-3 text-amber-400" />
                        <span>{formatExpiryTime(req.expires_at)}</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500 font-mono">
                      Queued: {new Date(req.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-blue-400 font-medium">{req.action_payload.tool}</span>
                    <span className="text-slate-500">::</span>
                    <span className="text-white font-medium">{req.action_payload.operation}</span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className="text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      {req.action_payload.resource}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {req.action_payload.description || 'Restricted external document export operation requested by agent.'}
                  </p>

                  {req.status === 'APPROVED' && req.execution_result && (
                    <div className="mt-2 p-2.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono space-y-0.5">
                      <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Execution Verified Under Supervisor Authority</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Destination: {req.execution_result.destination || 'sftp://vault.sentrix.corp'} &bull;
                        Package: {req.execution_result.packageChecksum || 'sha256:verified'}
                      </div>
                    </div>
                  )}

                  {req.status === 'EXPIRED' && (
                    <div className="mt-2 p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono space-y-0.5">
                      <div className="text-rose-400 font-medium flex items-center gap-1.5">
                        <TimerOff className="w-3.5 h-3.5" />
                        <span>Validity Expired &mdash; Execution Denied</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        TTL elapsed prior to review. Expired actions cannot be executed.
                      </div>
                    </div>
                  )}

                  {req.status === 'REJECTED' && (
                    <div className="mt-2 p-2.5 rounded bg-rose-950/30 border border-rose-800/40 text-xs font-mono text-rose-400">
                      Operation terminated by supervisor. Target resources protected.
                    </div>
                  )}
                </div>

                {req.status === 'PENDING' ? (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => onSimulateExpiry(req.id)}
                      disabled={isLoading}
                      title="Simulate permission expiry to test server-side auto-expiry denial"
                      className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <TimerOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulate Expiry</span>
                    </button>

                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-md bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Authorize & Execute</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-right shrink-0 font-mono text-xs text-slate-500">
                    <div>Reviewed by: <span className="text-slate-300">{req.reviewed_by || 'Supervisor'}</span></div>
                    <div>At: {req.reviewed_at ? new Date(req.reviewed_at).toLocaleTimeString() : 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

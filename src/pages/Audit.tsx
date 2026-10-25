import React, { useState } from 'react';
import { AuditEvent, PolicyDecision, ExecutionStatus, IntegrityVerificationResult, AuditEventType } from '../types';
import { DecisionBadge, ExecutionBadge, RiskBadge } from '../components/common/Badge';
import { api } from '../lib/api';
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Key,
  Layers,
  Sparkles,
  RotateCcw,
  Info
} from 'lucide-react';

interface AuditProps {
  events: AuditEvent[];
  isLoading: boolean;
  onRefreshAudit?: () => Promise<void>;
}

export const Audit: React.FC<AuditProps> = ({ events, onRefreshAudit }) => {
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | PolicyDecision>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExecutionStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AuditEventType>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditIntegrity();
      if (res.success) {
        setVerificationResult(res.verification);
      }
    } catch (e: any) {
      console.error('Verification error:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      await api.simulateAuditTamper();
      if (onRefreshAudit) {
        await onRefreshAudit();
      }
      // Automatically re-verify to show detected tamper
      const res = await api.verifyAuditIntegrity();
      if (res.success) {
        setVerificationResult(res.verification);
      }
    } catch (e: any) {
      console.error('Tamper simulation error:', e);
    } finally {
      setIsTampering(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = events.filter((ev) => {
    const matchesDecision = decisionFilter === 'ALL' || ev.decision === decisionFilter;
    const matchesStatus = statusFilter === 'ALL' || ev.execution_status === statusFilter;
    const matchesType = typeFilter === 'ALL' || ev.event_type === typeFilter;
    const matchesSearch =
      ev.id.toLowerCase().includes(search.toLowerCase()) ||
      ev.action_id.toLowerCase().includes(search.toLowerCase()) ||
      (ev.agent_id && ev.agent_id.toLowerCase().includes(search.toLowerCase())) ||
      ev.tool.toLowerCase().includes(search.toLowerCase()) ||
      ev.operation.toLowerCase().includes(search.toLowerCase()) ||
      ev.resource.toLowerCase().includes(search.toLowerCase()) ||
      ev.reason.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase()));

    return matchesDecision && matchesStatus && matchesType && matchesSearch;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentrix_audit_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCsv = () => {
    const headers = [
      'Event_ID',
      'Action_ID',
      'Timestamp',
      'Agent',
      'Event_Type',
      'Tool',
      'Operation',
      'Resource',
      'Decision',
      'Execution_Status',
      'Risk_Score',
      'Matched_Policy',
      'Prev_Hash',
      'Current_Hash',
      'Reason'
    ];

    const rows = events.map(e => [
      `"${e.id}"`,
      `"${e.action_id}"`,
      `"${e.created_at}"`,
      `"${e.agent_id || ''}"`,
      `"${e.event_type || 'ACTION_EVALUATION'}"`,
      `"${e.tool}"`,
      `"${e.operation}"`,
      `"${e.resource}"`,
      `"${e.decision}"`,
      `"${e.execution_status}"`,
      e.risk_score ?? 50,
      `"${e.matched_policy_id || ''}"`,
      `"${e.prev_hash || ''}"`,
      `"${e.hash || ''}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `sentrix_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#CC9166] font-mono text-xs uppercase tracking-wider mb-1">
            <Key className="w-3.5 h-3.5 text-[#CC9166]" />
            <span>Cryptographic Proof of Enforcement</span>
          </div>
          <h1 className="font-serif text-2xl text-white tracking-tight">
            Tamper-Evident Audit Ledger &amp; Hash Verifier
          </h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Immutable chronological compliance trail. Every intercepted action, policy change, and approval decision is cryptographically sealed via SHA-256 hash chains linked to Genesis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Verify Integrity Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-2 rounded-[8px] bg-[#CC9166] hover:bg-[#b88055] text-[#08080A] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Chain...' : 'Verify Chain Integrity'}</span>
          </button>

          {/* Simulate Tamper */}
          <button
            onClick={handleSimulateTamper}
            disabled={isTampering}
            className="px-3 py-2 rounded-[8px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Alters an event payload to demonstrate instant tamper detection"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Tamper</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={exportJson}
            className="px-3 py-2 rounded-[8px] bg-[#121317] hover:bg-[#1C1D22] border border-[#1C1D22] hover:border-[#2E3038] text-xs font-medium text-[#C7C9D1] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#9194A1]" />
            <span>JSON</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-[8px] bg-[#121317] hover:bg-[#1C1D22] border border-[#1C1D22] hover:border-[#2E3038] text-xs font-medium text-[#C7C9D1] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#9194A1]" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-[10px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            verificationResult.valid
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/50 text-rose-200 animate-pulse'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {verificationResult.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold text-sm tracking-wide">
                {verificationResult.valid ? 'CRYPTOGRAPHIC INTEGRITY VERIFIED' : 'SECURITY ALERT: AUDIT TAMPER DETECTED'}
              </span>
              <p className="text-xs leading-relaxed font-sans opacity-90">{verificationResult.message}</p>
            </div>
          </div>

          <div className="font-mono text-[11px] shrink-0 self-end sm:self-center px-2.5 py-1 rounded bg-[#040406]/60 border border-white/10">
            {verificationResult.verifiedEvents} of {verificationResult.totalEvents} Events Verified
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="enterprise-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9194A1] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Event ID, Action ID, Agent, Tool, Resource, or Justification..."
              className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-[#040406] border border-[#1C1D22] text-xs text-white placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Event Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-[8px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166] transition-colors"
            >
              <option value="ALL">All Event Types</option>
              <option value="ACTION_EVALUATION">Action Evaluation</option>
              <option value="APPROVAL_REQUEST">Approval Request</option>
              <option value="APPROVAL_DECISION">Approval Decision</option>
              <option value="POLICY_CHANGE">Policy Change</option>
              <option value="EMERGENCY_STOP">Emergency Stop</option>
            </select>

            {/* Decision Filter */}
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as any)}
              className="px-3 py-2 rounded-[8px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166] transition-colors"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="BLOCK">BLOCK</option>
              <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-[8px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166] transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="EXECUTED">EXECUTED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1C1D22] text-[#9194A1] font-mono text-[11px] uppercase bg-[#040406]/60">
                <th className="py-3 px-4">Event &amp; Action ID</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Agent</th>
                <th className="py-3 px-3">Operation Target</th>
                <th className="py-3 px-3">Risk</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Execution</th>
                <th className="py-3 px-3">SHA-256 Seal</th>
                <th className="py-3 px-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1D22]/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9194A1]">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  const shortHash = ev.hash ? `${ev.hash.slice(0, 10)}...` : 'Unsealed';

                  return (
                    <React.Fragment key={ev.id}>
                      <tr className="hover:bg-[#121317]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[#C7C9D1]">
                          <div className="font-semibold text-white text-xs">{ev.id}</div>
                          <div className="text-[10px] text-[#9194A1]">{ev.action_id}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#9194A1] whitespace-nowrap text-[11px]">
                          {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[11px] text-[#C7C9D1]">
                            {ev.agent_id || 'system'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div>
                            <span className="text-[#CC9166]">{ev.tool}</span>
                            <span className="text-[#9194A1]">:</span>
                            <span className="text-[#E2E3E9]">{ev.operation}</span>
                          </div>
                          <div className="text-[10px] text-[#9194A1] truncate max-w-[140px]" title={ev.resource}>
                            &rarr; {ev.resource}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <RiskBadge score={ev.risk_score || 50} level={ev.risk_level} size="sm" />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <DecisionBadge decision={ev.decision} size="sm" />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <ExecutionBadge status={ev.execution_status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                          {ev.hash ? (
                            <button
                              onClick={() => copyToClipboard(ev.hash!, ev.id)}
                              className="flex items-center gap-1 text-[#9194A1] hover:text-[#CC9166] transition-colors"
                              title={`Full Seal: ${ev.hash}\nPrev: ${ev.prev_hash}`}
                            >
                              <span>{shortHash}</span>
                              {copiedHash === ev.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[#9194A1]/60">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                            className="p-1.5 rounded-[6px] bg-[#040406] hover:bg-[#1C1D22] border border-[#1C1D22] text-[#9194A1] hover:text-white transition-colors"
                            title="Expand Audit Event Details"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-[#040406]/90 border-b border-[#1C1D22]">
                          <td colSpan={9} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3.5 rounded-[8px] bg-[#121317] border border-[#1C1D22] space-y-1">
                                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Enforcement Rationale</span>
                                <p className="text-[#E2E3E9] font-sans leading-relaxed">{ev.reason}</p>
                              </div>

                              <div className="p-3.5 rounded-[8px] bg-[#121317] border border-[#1C1D22] space-y-1">
                                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Action Description</span>
                                <p className="text-[#C7C9D1] font-sans leading-relaxed">{ev.description || 'No description provided'}</p>
                              </div>
                            </div>

                            {/* Cryptographic Link Details */}
                            {ev.hash && (
                              <div className="p-3.5 rounded-[8px] bg-[#121317] border border-[#1C1D22] font-mono text-[11px] space-y-1">
                                <div className="text-[#CC9166] font-bold uppercase text-[10px]">
                                  Cryptographic Chain Proof:
                                </div>
                                <div className="text-[#C7C9D1] break-all">
                                  Current Event Hash: <span className="text-emerald-400">{ev.hash}</span>
                                </div>
                                <div className="text-[#9194A1] break-all">
                                  Predecessor Hash: <span className="text-[#CC9166]/80">{ev.prev_hash}</span>
                                </div>
                              </div>
                            )}

                            {/* Output or Payload */}
                            {ev.execution_output && (
                              <div className="p-3.5 rounded-[8px] bg-[#121317] border border-[#1C1D22] space-y-1">
                                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Execution Output / Security Telemetry:</span>
                                <pre className="font-mono text-[11px] text-[#C7C9D1] bg-[#040406] p-3 rounded-[6px] border border-[#1C1D22] overflow-x-auto max-h-40">
                                  {JSON.stringify(ev.execution_output, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

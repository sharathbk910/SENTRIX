import React, { useState } from 'react';
import { AuditEvent, PolicyDecision, ExecutionStatus } from '../types';
import { DecisionBadge, ExecutionBadge } from '../components/common/Badge';
import {
  FileText,
  Search,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AuditProps {
  events: AuditEvent[];
  isLoading: boolean;
}

export const Audit: React.FC<AuditProps> = ({ events }) => {
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | PolicyDecision>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExecutionStatus>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = events.filter((ev) => {
    const matchesDecision = decisionFilter === 'ALL' || ev.decision === decisionFilter;
    const matchesStatus = statusFilter === 'ALL' || ev.execution_status === statusFilter;
    const matchesSearch =
      ev.action_id.toLowerCase().includes(search.toLowerCase()) ||
      ev.tool.toLowerCase().includes(search.toLowerCase()) ||
      ev.operation.toLowerCase().includes(search.toLowerCase()) ||
      ev.resource.toLowerCase().includes(search.toLowerCase()) ||
      ev.reason.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase()));

    return matchesDecision && matchesStatus && matchesSearch;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentrix_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Chronological compliance record of all autonomous tool requests intercepted and evaluated by the SENTRIX gateway.
          </p>
        </div>

        <button
          onClick={exportJson}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export JSON ({events.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="enterprise-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Action ID, Tool, Resource, or Justification..."
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 shrink-0">Decision:</span>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="BLOCK">BLOCK</option>
              <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="EXECUTED">EXECUTED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="REJECTED">REJECTED</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action ID</th>
                <th className="py-3 px-4 font-semibold">Tool & Operation</th>
                <th className="py-3 px-4 font-semibold">Target Resource</th>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold">Execution</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  return (
                    <React.Fragment key={ev.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                          {ev.action_id}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="text-blue-400">{ev.tool}</span>
                          <span className="text-slate-500">::</span>
                          <span className="text-white">{ev.operation}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {ev.resource}
                        </td>
                        <td className="py-3 px-4">
                          <DecisionBadge decision={ev.decision} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <ExecutionBadge status={ev.execution_status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 ml-auto" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-y border-slate-800">
                          <td colSpan={7} className="p-4 space-y-3 font-mono text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold text-slate-400">
                                  Evaluation Justification:
                                </div>
                                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-sans text-xs">
                                  {ev.reason}
                                </div>
                                {ev.agent_id && (
                                  <div className="text-slate-400 text-xs">
                                    <span className="text-slate-500 font-mono">Agent: </span>
                                    {ev.agent_id}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold text-slate-400">
                                  Execution Telemetry & Output:
                                </div>
                                <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-36">
                                  {JSON.stringify(ev.execution_output || { status: ev.execution_status }, null, 2)}
                                </pre>
                              </div>
                            </div>
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

import React, { useState } from 'react';
import { SystemStats, AuditEvent, PolicyDecision, RiskLevel } from '../types';
import { DecisionBadge, ExecutionBadge, RiskBadge } from '../components/common/Badge';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  ArrowRight,
  FileKey,
  Terminal,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Play
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface DashboardProps {
  stats: SystemStats | null;
  recentEvents: AuditEvent[];
  onRouteChange: (route: RouteId) => void;
  onQuickRunScenario: (scenarioIndex: number) => void;
  isEvaluating: boolean;
  onRefreshData?: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentEvents,
  onRouteChange,
  onQuickRunScenario,
  isEvaluating,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | PolicyDecision>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const handleManualRefresh = async () => {
    if (onRefreshData) {
      setIsRefreshing(true);
      await onRefreshData();
      setIsRefreshing(false);
    }
  };

  // Filter actions
  const filteredEvents = recentEvents.filter((ev) => {
    const matchesDecision = decisionFilter === 'ALL' || ev.decision === decisionFilter;
    const matchesRisk = riskFilter === 'ALL' || ev.risk_level === riskFilter;
    const matchesSearch =
      ev.action_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.agent_id && ev.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ev.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDecision && matchesRisk && matchesSearch;
  });

  const highRiskCount = stats?.highRiskEventsCount ?? recentEvents.filter(e => (e.risk_score || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#CC9166] font-mono text-[11px] uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5 text-[#CC9166]" />
            <span>Real-Time Security Gateway Telemetry</span>
          </div>
          <h1 className="text-2xl font-serif text-white tracking-tight font-normal">
            AI Agent Action & Defense Dashboard
          </h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Live monitoring of intercepted autonomous agent actions, server-enforced policy decisions, quarantine approvals, and containment rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Connection Status Pill */}
          <div className="px-3 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[11px] font-mono flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#C7C9D1]">Gateway: Active (Polling 8s)</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-[6px] bg-[#121317] hover:bg-[#17181F] text-[#9194A1] hover:text-white border border-[#1C1D22] hover:border-[#2E3038] transition-colors"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onRouteChange('attack-demo')}
            className="px-3.5 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Launch Attack Demo</span>
          </button>
        </div>
      </div>

      {/* Emergency Stop / Kill Switch Banner if active */}
      {stats?.emergencyPaused && (
        <div className="p-4 rounded-[10px] bg-rose-500/[0.08] border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">CRITICAL: EMERGENCY STOP ACTIVE</span>
              <p className="text-rose-200 text-xs mt-0.5">All autonomous agent tool calls are hard-stopped at the gateway boundary. No actions can reach protected resources.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-[4px] bg-rose-500/[0.15] border border-rose-500/40 text-white font-mono text-[10px] font-bold">
            HARD HALT
          </span>
        </div>
      )}

      {/* Core KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Actions</span>
            <Activity className="w-3.5 h-3.5 text-[#CC9166]" />
          </div>
          <div className="text-2xl font-mono font-medium text-white">
            {stats?.totalActions ?? 0}
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Intercepted proposals</span>
        </div>

        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Allowed Actions</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-medium text-emerald-400">
            {stats?.allowedCount ?? 0}
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Safe compliant writes/reads</span>
        </div>

        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Blocked Actions</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-medium text-rose-400">
            {stats?.blockedCount ?? 0}
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Unsafe actions intercepted</span>
        </div>

        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="text-2xl font-mono font-medium text-amber-300">
            {stats?.pendingApprovalCount ?? 0}
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Quarantined with TTL</span>
        </div>

        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">High-Risk Events</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-medium text-rose-400">
            {highRiskCount}
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Risk score &ge; 80/100</span>
        </div>

        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9194A1] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Containment Rate</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-medium text-emerald-400">
            {stats?.containmentRate ?? 100}%
          </div>
          <span className="text-[10px] text-[#9194A1] mt-1">Threat mitigation ratio</span>
        </div>
      </div>

      {/* Evaluator Quick-Launch Benchmark Runner */}
      <div className="enterprise-card p-4 bg-[#121317] border border-[#1C1D22] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-medium text-[#E2E3E9] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#CC9166]" />
            <span>Interactive 1-Click Verification Scenarios:</span>
          </span>
          <span className="text-[10px] font-mono text-[#9194A1]">
            Click any test to fire through the real server-side gateway
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: '1. Safe Read', tag: 'ALLOW', color: 'emerald' },
            { label: '2. Delete Ledger', tag: 'BLOCK', color: 'rose' },
            { label: '3. Exfiltration', tag: 'APPROVAL', color: 'amber' },
            { label: '4. Unknown Tool', tag: 'DENY-DEF', color: 'rose' },
            { label: '5. Secret Leak', tag: 'DLP BLOCK', color: 'blue' },
            { label: '6. Prompt Injection', tag: 'INJECTION', color: 'purple' },
            { label: '7. Denial Burst', tag: 'ANOMALY', color: 'amber' }
          ].map((sc, i) => (
            <button
              key={i}
              onClick={() => onQuickRunScenario(i)}
              disabled={isEvaluating}
              className="p-2 rounded-[6px] bg-[#040406] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-left transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-[#9194A1]">Step {i + 1}</span>
                <span className={`font-semibold text-${sc.color}-400 text-[9px]`}>{sc.tag}</span>
              </div>
              <div className="text-xs font-medium text-white truncate">{sc.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Agent Action Feed Section */}
      <div className="enterprise-card p-5 space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1C1D22] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#CC9166]" />
            <h2 className="text-base font-serif text-white font-normal tracking-tight">
              Real-Time Intercepted Action Feed ({filteredEvents.length} events)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9194A1] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agent, tool, resource..."
                className="pl-8 pr-3 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166] w-44 sm:w-56"
              />
            </div>

            {/* Decision Filter */}
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#C7C9D1] focus:outline-none focus:border-[#CC9166]"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="BLOCK">BLOCK</option>
              <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#C7C9D1] focus:outline-none focus:border-[#CC9166]"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical (&ge;90)</option>
              <option value="HIGH">High (70-89)</option>
              <option value="MEDIUM">Medium (40-69)</option>
              <option value="LOW">Low (&lt;40)</option>
            </select>
          </div>
        </div>

        {/* Action Feed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1C1D22] text-[#9194A1] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Requested Operation</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Matched Policy</th>
                <th className="py-2.5 px-3">Execution</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1D22]/60 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#9194A1]">
                    No action records match your current filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-[#17181F]/70 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono text-[#9194A1] whitespace-nowrap text-[11px]">
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#E2E3E9] whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[10px]">
                        {event.agent_id || 'agent-default'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#C7C9D1]">
                      <span className="text-[#CC9166]">{event.tool}</span>
                      <span className="text-[#9194A1]">:</span>
                      <span className="text-[#E2E3E9]">{event.operation}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#C7C9D1] whitespace-nowrap">
                      <span className="text-[#C7C9D1] truncate max-w-[140px] inline-block" title={event.resource}>
                        {event.resource}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <RiskBadge score={event.risk_score || 50} level={event.risk_level} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <DecisionBadge decision={event.decision} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#9194A1] text-[11px] whitespace-nowrap">
                      {event.matched_policy_id ? (
                        <span className="text-[#E2E3E9] font-medium" title={event.matched_policy_name}>
                          {event.matched_policy_id}
                        </span>
                      ) : (
                        <span className="text-[#9194A1]">Baseline Def.</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <ExecutionBadge status={event.execution_status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="px-2 py-1 rounded-[4px] bg-[#040406] hover:bg-[#17181F] text-[#9194A1] hover:text-white border border-[#1C1D22] hover:border-[#2E3038] text-[11px] font-mono transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector for Action Record */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-[#1C1D22] rounded-[10px] p-6 max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#9194A1] uppercase tracking-wider">Action Record Inspector</span>
                <h3 className="text-base font-serif text-white font-normal">{selectedEvent.action_id}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-[4px] text-[#9194A1] hover:text-white hover:bg-[#17181F]"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Agent Identifier</span>
                <div className="font-mono text-[#E2E3E9]">{selectedEvent.agent_id}</div>
              </div>
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Timestamp</span>
                <div className="font-mono text-[#E2E3E9]">{new Date(selectedEvent.created_at).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Decision & Risk</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <DecisionBadge decision={selectedEvent.decision} size="sm" />
                  <RiskBadge score={selectedEvent.risk_score || 50} level={selectedEvent.risk_level} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1">
                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Execution Status</span>
                <div className="pt-0.5">
                  <ExecutionBadge status={selectedEvent.execution_status} size="sm" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1 text-xs">
              <span className="text-[10px] text-[#9194A1] font-mono uppercase">Security Justification / Policy Verdict</span>
              <p className="text-[#C7C9D1] leading-relaxed">{selectedEvent.reason}</p>
            </div>

            {selectedEvent.description && (
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1 text-xs">
                <span className="text-[10px] text-[#9194A1] font-mono uppercase">Proposed Intent / Description</span>
                <p className="text-[#C7C9D1] font-sans">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.hash && (
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] space-y-1 text-xs">
                <span className="text-[10px] text-[#CC9166] font-mono uppercase">Cryptographic Hash Seal (SHA-256)</span>
                <div className="font-mono text-[#9194A1] text-[11px] break-all">{selectedEvent.hash}</div>
                <div className="text-[10px] font-mono text-[#9194A1]/80">Prev Hash: {selectedEvent.prev_hash}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#1C1D22]">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-[6px] bg-[#08080A] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-xs font-semibold text-white transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

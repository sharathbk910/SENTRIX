import React from 'react';
import { SystemStats, AuditEvent } from '../types';
import { DecisionBadge, ExecutionBadge } from '../components/common/Badge';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  ArrowRight,
  Play,
  FileKey,
  Terminal,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface DashboardProps {
  stats: SystemStats | null;
  recentEvents: AuditEvent[];
  onRouteChange: (route: RouteId) => void;
  onQuickRunScenario: (scenarioIndex: number) => void;
  isEvaluating: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentEvents,
  onRouteChange,
  onQuickRunScenario,
  isEvaluating
}) => {
  const primaryStats = [
    {
      title: 'Total Evaluated Actions',
      value: stats?.totalActions ?? 0,
      sub: 'Intercepted operations',
      icon: Activity,
      textColor: 'text-white'
    },
    {
      title: 'Allowed Operations',
      value: stats?.allowedCount ?? 0,
      sub: 'Passed safe policies',
      icon: ShieldCheck,
      textColor: 'text-emerald-400'
    },
    {
      title: 'Blocked Threats',
      value: stats?.blockedCount ?? 0,
      sub: 'Prevented destructive write',
      icon: ShieldAlert,
      textColor: 'text-rose-400'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovalCount ?? 0,
      sub: 'Quarantined with TTL',
      icon: Clock,
      textColor: 'text-amber-300'
    }
  ];

  const defenseStats = [
    {
      title: 'Sensitive Leaks Prevented',
      value: stats?.sensitiveLeaksBlockedCount ?? 0,
      sub: 'Secret tokens & credentials blocked',
      icon: FileKey,
      badge: 'DLP Active'
    },
    {
      title: 'Prompt Injections Defused',
      value: stats?.injectionsDetectedCount ?? 0,
      sub: 'Adversarial instructions neutralized',
      icon: Terminal,
      badge: 'Heuristic Shield'
    },
    {
      title: 'Behavior Anomalies',
      value: stats?.activeAlertsCount ?? 0,
      sub: 'Repeated block spikes (&ge;3/5m)',
      icon: AlertTriangle,
      badge: (stats?.activeAlertsCount ?? 0) > 0 ? 'Action Required' : 'Nominal'
    },
    {
      title: 'Policy Conflicts',
      value: stats?.policyConflictsCount ?? 0,
      sub: 'Deny-first fallback active',
      icon: Layers,
      badge: (stats?.policyConflictsCount ?? 0) > 0 ? 'Conflict Alert' : 'Aligned'
    }
  ];

  const quickScenarios = [
    {
      title: '1. Public Catalogue Read',
      tool: 'file_store:read',
      resource: 'public_catalogue',
      expected: 'ALLOW',
      desc: 'Validates permissive read on public product catalogue.'
    },
    {
      title: '2. Financial Ledger Deletion',
      tool: 'file_store:delete',
      resource: 'financial_records_2025',
      expected: 'BLOCK',
      desc: 'Attempts destructive delete; ledger is preserved intact.'
    },
    {
      title: '3. Confidential Dossier Export',
      tool: 'data_transfer:transfer',
      resource: 'confidential_customer_dossier',
      expected: 'REQUIRE_APPROVAL',
      desc: 'Quarantines sensitive transfer with a 10-minute auto-expiry TTL.'
    },
    {
      title: '4. Unknown / Unauthorized Op',
      tool: 'unregistered_utility:exec',
      resource: 'internal_cluster_secrets',
      expected: 'BLOCK (DENY-DEFAULT)',
      desc: 'Blocks unregistered tools and missing permissions by default.'
    },
    {
      title: '5. Sensitive Data Leak Attempt',
      tool: 'data_transfer:export',
      resource: 'confidential_customer_dossier',
      expected: 'BLOCK (LEAK)',
      desc: 'Detects and neutralizes secret API keys and credentials before export.'
    },
    {
      title: '6. Prompt Injection Attack',
      tool: 'file_store:read',
      resource: 'public_catalogue',
      expected: 'BLOCK (INJECTION)',
      desc: 'Catches adversarial "ignore previous instructions" in untrusted text.'
    },
    {
      title: '7. Repeated Denial Anomaly',
      tool: 'system_shell:exec',
      resource: 'root_passwords',
      expected: 'ANOMALY ALERT',
      desc: 'Triggers 3 repeated blocks to generate a behavior anomaly alert.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Executive Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Gateway Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time enforcement metrics, autonomous agent telemetry, and active compliance guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onRouteChange('playground')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Open Policy Gateway</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Usability Upgrade: 30-Second Quick Start Guide for Evaluators */}
      <div className="enterprise-card p-5 bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border-blue-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Quick-Start Evaluator Tour (1-Click Test Scenarios)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any button to test live server-side enforcement
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
          <button
            onClick={() => onQuickRunScenario(0)}
            disabled={isEvaluating}
            className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Step 1</span>
              <span className="text-emerald-400 font-bold">ALLOW</span>
            </div>
            <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
              Public Catalogue
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Permissive Read</div>
          </button>

          <button
            onClick={() => onQuickRunScenario(1)}
            disabled={isEvaluating}
            className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Step 2</span>
              <span className="text-rose-400 font-bold">BLOCK</span>
            </div>
            <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
              Delete Ledger
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Immutable Defense</div>
          </button>

          <button
            onClick={() => onQuickRunScenario(2)}
            disabled={isEvaluating}
            className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Step 3</span>
              <span className="text-amber-300 font-bold">APPROVAL</span>
            </div>
            <div className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
              Transfer Dossier
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">10m Expiry TTL</div>
          </button>

          <button
            onClick={() => onQuickRunScenario(3)}
            disabled={isEvaluating}
            className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Step 4</span>
              <span className="text-rose-400 font-bold">DENY-DEFAULT</span>
            </div>
            <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
              Unknown Tool
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero Permissive Leak</div>
          </button>

          <button
            onClick={() => onQuickRunScenario(4)}
            disabled={isEvaluating}
            className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-left transition-all group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Step 5</span>
              <span className="text-blue-400 font-bold">DLP LEAK</span>
            </div>
            <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
              Secret Token
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Mask & Terminate</div>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="enterprise-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">{item.title}</span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`text-2xl font-bold font-mono tracking-tight ${item.textColor}`}>
                {item.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{item.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Secondary Defense Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defenseStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="enterprise-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">{item.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  {item.badge}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{item.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Verification Scenarios */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Policy Verification Benchmarks</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute verifiable agent tool calls to confirm deterministic enforcement.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Server Enforced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickScenarios.map((sc, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{sc.title}</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {sc.expected}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.desc}</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 truncate">
                  {sc.tool} &rarr; {sc.resource}
                </div>
              </div>

              <button
                onClick={() => onQuickRunScenario(idx)}
                disabled={isEvaluating}
                className="w-full py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current text-blue-400" />
                <span>Run Test</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Recent Gateway Intercept Stream</h2>
          </div>
          <button
            onClick={() => onRouteChange('audit')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            <span>View Full Audit Trail ({recentEvents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No events recorded yet. Run a verification benchmark above to generate an audit event.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <DecisionBadge decision={ev.decision} size="sm" />
                  <div>
                    <div className="font-mono text-slate-200 flex flex-wrap items-center gap-1.5">
                      <span className="text-blue-400">{ev.tool}</span>
                      <span className="text-slate-500">::</span>
                      <span className="text-white">{ev.operation}</span>
                      <span className="text-slate-500">&rarr;</span>
                      <span className="text-slate-300">{ev.resource}</span>
                      {ev.agent_id && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {ev.agent_id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ev.reason}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center self-end">
                  <ExecutionBadge status={ev.execution_status} size="sm" />
                  <span className="font-mono text-xs text-slate-500">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

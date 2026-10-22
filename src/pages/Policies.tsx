import React, { useState } from 'react';
import { Policy, PolicyDecision, PolicyConflictWarning } from '../types';
import { DecisionBadge } from '../components/common/Badge';
import {
  ShieldCheck,
  Search,
  Lock,
  AlertTriangle,
  Layers,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PoliciesProps {
  policies: Policy[];
  conflicts: PolicyConflictWarning[];
  onTogglePolicy: (id: string) => Promise<void>;
  onTestPolicy?: (policy: Policy) => void;
  isLoading: boolean;
}

export const Policies: React.FC<PoliciesProps> = ({
  policies,
  conflicts,
  onTogglePolicy,
  onTestPolicy,
  isLoading
}) => {
  const [filter, setFilter] = useState<'ALL' | PolicyDecision>('ALL');
  const [search, setSearch] = useState('');

  const filtered = policies.filter((p) => {
    const matchesFilter = filter === 'ALL' || p.decision === filter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tool.toLowerCase().includes(search.toLowerCase()) ||
      p.operation.toLowerCase().includes(search.toLowerCase()) ||
      p.resource_pattern.toLowerCase().includes(search.toLowerCase()) ||
      p.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const demoConflictPolicy = policies.find(p => p.id === 'POL-005');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic Policy Authority</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Security Policies & Boundary Controls
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Deterministic rules evaluated server-side. Validates access patterns, detects contradictory policies, and enforces deny-first fallbacks.
          </p>
        </div>

        {/* Global Policy Baseline Badge */}
        <div className="enterprise-card px-3.5 py-2 flex items-center gap-2.5 self-start sm:self-auto">
          <Lock className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-xs">
            <div className="text-slate-400 text-[10px]">Gateway Posture:</div>
            <div className="text-emerald-400 font-mono font-semibold text-xs">DENY-BY-DEFAULT</div>
          </div>
        </div>
      </div>

      {/* Policy Conflict Alert Section */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Contradictory Policy Rules Detected ({conflicts.length})</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300 font-semibold">
              RESOLUTION: DENY-FIRST
            </span>
          </div>

          <div className="space-y-2">
            {conflicts.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/20 text-xs font-mono space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-semibold">{c.policyIdA} [{c.decisionA}]</span>
                    <span className="text-slate-500">&harr;</span>
                    <span className="text-rose-400 font-semibold">{c.policyIdB} [{c.decisionB}]</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Scope: {c.scope}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">{c.description}</p>
                <div className="text-amber-300/90 text-[11px] font-sans">
                  &rarr; Conflict resolution: Requests matching both rules are automatically blocked by the deny-first safety guarantee.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Simulator Tool */}
      {demoConflictPolicy && (
        <div className="enterprise-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Rule Conflict Simulator</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  demoConflictPolicy.enabled 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {demoConflictPolicy.enabled ? 'POL-005 Active (Conflict)' : 'POL-005 Inactive (Nominal)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Toggle rule POL-005 to test contradictory policy handling against POL-001 on 'public_catalogue'.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTogglePolicy('POL-005')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              demoConflictPolicy.enabled
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {demoConflictPolicy.enabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Disable Conflict Rule</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Simulate Conflict</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="enterprise-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies by name, tool, operation, or resource pattern..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          {(['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-md transition-colors text-xs font-medium ${
                filter === tab
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'REQUIRE_APPROVAL' ? 'APPROVAL' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-3">
        {filtered.map((policy) => (
          <div
            key={policy.id}
            className={`p-4 rounded-xl border transition-colors ${
              policy.enabled
                ? 'enterprise-card'
                : 'bg-slate-950/40 border-slate-800/80 opacity-60'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                    {policy.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    {policy.name}
                  </h3>
                  <DecisionBadge decision={policy.decision} size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Tool:</span>
                    <span className="text-blue-400 font-medium">{policy.tool}</span>
                  </div>
                  <span className="text-slate-700">&bull;</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Operation:</span>
                    <span className="text-slate-200 font-medium">{policy.operation}</span>
                  </div>
                  <span className="text-slate-700">&bull;</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Target Pattern:</span>
                    <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                      {policy.resource_pattern}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {policy.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                {onTestPolicy && (
                  <button
                    type="button"
                    onClick={() => onTestPolicy(policy)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                    title="Load this policy into the Gateway Console to test live evaluation"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test in Gateway</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onTogglePolicy(policy.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
                    policy.enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {policy.enabled ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Enforcing</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

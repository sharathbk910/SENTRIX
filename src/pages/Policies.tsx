import React, { useState } from 'react';
import { Policy, PolicyDecision, PolicyConflictWarning, PolicyTranslationResult } from '../types';
import { DecisionBadge, RiskBadge } from '../components/common/Badge';
import { api } from '../lib/api';
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
  PlusCircle,
  Trash2,
  AlertOctagon
} from 'lucide-react';

interface PoliciesProps {
  policies: Policy[];
  conflicts: PolicyConflictWarning[];
  onTogglePolicy: (id: string) => Promise<void>;
  onTestPolicy?: (policy: Policy) => void;
  onRefreshPolicies?: () => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_NLP_RULES = [
  'Require manager approval for payments exceeding $100.',
  'Never allow an agent to delete production database records.',
  'Block all attempts to send confidential files to external destinations.',
  'Allow read-only access to approved customer support tickets.',
  'Block attempts to reveal API keys, credentials, or secret tokens.'
];

export const Policies: React.FC<PoliciesProps> = ({
  policies,
  conflicts,
  onTogglePolicy,
  onTestPolicy,
  onRefreshPolicies,
  isLoading
}) => {
  const [filter, setFilter] = useState<'ALL' | PolicyDecision>('ALL');
  const [search, setSearch] = useState('');

  // Plain-English Builder State
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [translationResult, setTranslationResult] = useState<PolicyTranslationResult | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Editable fields for reviewed draft
  const [draftName, setDraftName] = useState('');
  const [draftTool, setDraftTool] = useState('');
  const [draftOperation, setDraftOperation] = useState('');
  const [draftResourcePattern, setDraftResourcePattern] = useState('');
  const [draftDecision, setDraftDecision] = useState<PolicyDecision>('BLOCK');
  const [draftRiskScore, setDraftRiskScore] = useState<number>(85);
  const [draftReason, setDraftReason] = useState('');

  const handleInterpretRule = async (statement?: string) => {
    const textToInterpret = statement || naturalLanguageInput;
    if (!textToInterpret.trim()) return;

    setIsTranslating(true);
    setTranslationError(null);
    setTranslationResult(null);

    try {
      const res = await api.translatePolicy(textToInterpret);
      if (res.success) {
        setTranslationResult(res);
        setDraftName(res.proposedPolicy.name);
        setDraftTool(res.proposedPolicy.tool);
        setDraftOperation(res.proposedPolicy.operation);
        setDraftResourcePattern(res.proposedPolicy.resource_pattern);
        setDraftDecision(res.proposedPolicy.decision);
        setDraftRiskScore(res.proposedPolicy.risk_score);
        setDraftReason(res.proposedPolicy.reason);
      } else {
        setTranslationError(res.validationErrors?.[0] || res.explanation || 'Interpretation failed.');
      }
    } catch (err: any) {
      setTranslationError(err?.message || 'Failed to communicate with policy interpreter.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!draftName || !draftTool || !draftOperation || !draftResourcePattern) {
      setTranslationError('All policy fields are mandatory.');
      return;
    }

    setIsSavingPolicy(true);
    setTranslationError(null);

    try {
      const res = await api.createPolicy({
        name: draftName,
        tool: draftTool,
        operation: draftOperation,
        resource_pattern: draftResourcePattern,
        decision: draftDecision,
        risk_score: draftRiskScore,
        reason: draftReason,
        natural_language_source: naturalLanguageInput || undefined,
        conditions: translationResult?.proposedPolicy.conditions,
        enabled: true,
        status: 'ACTIVE',
        version: 1
      });

      if (res.success) {
        setTranslationResult(null);
        setNaturalLanguageInput('');
        if (onRefreshPolicies) {
          await onRefreshPolicies();
        }
      }
    } catch (err: any) {
      setTranslationError(err?.message || 'Failed to activate policy.');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await api.deletePolicy(id);
      if (onRefreshPolicies) {
        await onRefreshPolicies();
      }
    } catch (err: any) {
      console.error('Failed to delete policy:', err);
    }
  };

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

  const demoConflictPolicy = policies.find((p) => p.id === 'POL-005');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[#CC9166] font-mono text-[11px] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic Gateway Policy</span>
          </div>
          <h1 className="text-2xl font-serif text-white tracking-tight font-normal">
            Security Rules
          </h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Define what autonomous AI agents are allowed to do, what is blocked, and what requires human supervisor approval before execution.
          </p>
        </div>

        {/* Global Policy Baseline Badge */}
        <div className="enterprise-card px-3.5 py-2 flex items-center gap-2.5 self-start sm:self-auto">
          <Lock className="w-4 h-4 text-[#CC9166] shrink-0" />
          <div className="text-xs">
            <div className="text-[#9194A1] text-[10px] uppercase font-mono">Default Stance:</div>
            <div className="text-emerald-400 font-mono font-medium text-xs">DENY-BY-DEFAULT</div>
          </div>
        </div>
      </div>

      {/* 3-Column Protection Overview: What SENTRIX Protects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-[10px] bg-[#121317] border border-emerald-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Allowed Actions</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
              {policies.filter((p) => p.decision === 'ALLOW').length} Rules
            </span>
          </div>
          <p className="text-xs text-[#C7C9D1] leading-relaxed">
            Permitted safe actions such as reading public product catalogs and specifications without elevation.
          </p>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121317] border border-amber-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Requires Approval</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
              {policies.filter((p) => p.decision === 'REQUIRE_APPROVAL').length} Rules
            </span>
          </div>
          <p className="text-xs text-[#C7C9D1] leading-relaxed">
            Sensitive actions like high-value transfers or exporting customer records. Held in quarantine pending supervisor clearance.
          </p>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121317] border border-rose-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Blocked Actions</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30">
              {policies.filter((p) => p.decision === 'BLOCK').length} Rules
            </span>
          </div>
          <p className="text-xs text-[#C7C9D1] leading-relaxed">
            Strictly prohibited actions including database deletion, credential exfiltration, and prompt injection attempts.
          </p>
        </div>
      </div>

      {/* Baseline Stance Notice */}
      <div className="p-3 rounded-[8px] bg-[#040406] border border-[#1C1D22] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#9194A1]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#CC9166]" />
          <span>
            <strong className="text-white">Fail-Closed Guarantee:</strong> Any action not explicitly permitted by an active rule is automatically blocked.
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/30 self-start sm:self-auto">
          FAIL-CLOSED ACTIVE
        </span>
      </div>

      {/* Add Rule Builder (Templates or Plain English) */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1D22] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#CC9166]" />
            <h2 className="text-base font-serif text-white font-normal">
              Create a Protection Rule
            </h2>
          </div>
          <span className="text-[11px] text-[#9194A1]">
            Describe your rule in plain English or select a template below
          </span>
        </div>

        {/* Quick-fill template chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-[#9194A1] font-medium">Quick-Start Templates:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_NLP_RULES.map((rule, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalLanguageInput(rule);
                  handleInterpretRule(rule);
                }}
                className="px-2.5 py-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] hover:border-[#2E3038] text-[11px] text-[#C7C9D1] hover:text-white transition-all text-left truncate max-w-sm"
              >
                &ldquo;{rule}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <textarea
            rows={2}
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            placeholder="Type your rule requirement in plain English (e.g. 'Require manager approval for payments exceeding $100')..."
            className="flex-1 p-2.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166]"
          />
          <button
            type="button"
            onClick={() => handleInterpretRule()}
            disabled={isTranslating || !naturalLanguageInput.trim()}
            className="px-4 py-2 rounded-[6px] bg-[#CC9166] hover:bg-[#B87E54] text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 self-end sm:self-auto"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
            <span>{isTranslating ? 'Validating...' : 'Validate Rule'}</span>
          </button>
        </div>

        {/* Error alert if validation failed */}
        {translationError && (
          <div className="p-3 rounded-[6px] bg-rose-500/[0.08] border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{translationError}</span>
          </div>
        )}

        {/* Pre-Activation Preview & Confirmation */}
        {translationResult && (
          <div className="p-4 rounded-[8px] bg-[#040406] border border-[#1C1D22] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-serif text-white font-normal uppercase tracking-wider">
                  Validated Rule Preview
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/[0.08] px-2 py-0.5 rounded border border-emerald-500/30">
                Confidence: {Math.round(translationResult.confidenceScore * 100)}%
              </span>
            </div>

            {/* Plain explanation */}
            <p className="text-xs text-[#C7C9D1] bg-[#121317] p-3 rounded-[6px] border border-[#1C1D22] leading-relaxed">
              {translationResult.explanation}
            </p>

            {/* Structured details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Rule Name</label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Tool Scope</label>
                <input
                  type="text"
                  value={draftTool}
                  onChange={(e) => setDraftTool(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Operation</label>
                <input
                  type="text"
                  value={draftOperation}
                  onChange={(e) => setDraftOperation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Target Resource</label>
                <input
                  type="text"
                  value={draftResourcePattern}
                  onChange={(e) => setDraftResourcePattern(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Enforcement Outcome</label>
                <select
                  value={draftDecision}
                  onChange={(e) => setDraftDecision(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono text-xs focus:outline-none focus:border-[#CC9166]"
                >
                  <option value="BLOCK">BLOCK</option>
                  <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                  <option value="ALLOW">ALLOW</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Risk Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftRiskScore}
                  onChange={(e) => setDraftRiskScore(parseInt(e.target.value, 10) || 50)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Purpose / Rationale</label>
                <input
                  type="text"
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166]"
                />
              </div>
            </div>

            {/* Pre-Activation Verification Cases */}
            <div className="space-y-2 pt-2 border-t border-[#1C1D22]">
              <span className="text-[10px] font-semibold text-[#9194A1] font-mono uppercase tracking-wider">
                Pre-Activation Test Verification:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {translationResult.testScenarios.map((sc, idx) => (
                  <div key={idx} className="p-3 rounded-[6px] bg-[#121317] border border-[#1C1D22] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#E2E3E9]">{sc.name}</span>
                      <DecisionBadge decision={sc.expectedDecision} size="sm" />
                    </div>
                    <div className="font-mono text-[11px] text-[#9194A1] truncate">
                      {sc.payload.tool}:{sc.payload.operation} &rarr; {sc.payload.resource}
                    </div>
                    <p className="text-[11px] text-[#9194A1] font-sans">{sc.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1C1D22]">
              <button
                type="button"
                onClick={() => setTranslationResult(null)}
                className="px-3 py-1.5 rounded-[6px] text-xs text-[#9194A1] hover:text-white transition-colors"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={isSavingPolicy}
                className="px-4 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isSavingPolicy ? 'Activating...' : 'Activate Rule'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Policy Conflict Alert Section */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-[10px] bg-amber-500/[0.08] border border-amber-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Contradictory Policy Rules Detected ({conflicts.length})</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#040406] border border-amber-500/40 text-amber-300 font-semibold">
              RESOLUTION: DENY-FIRST
            </span>
          </div>

          <div className="space-y-2">
            {conflicts.map((c) => (
              <div key={c.id} className="p-3 rounded-[6px] bg-[#040406] border border-amber-500/20 text-xs font-mono space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#CC9166] font-semibold">{c.policyIdA} [{c.decisionA}]</span>
                    <span className="text-[#9194A1]">&harr;</span>
                    <span className="text-rose-400 font-semibold">{c.policyIdB} [{c.decisionB}]</span>
                  </div>
                  <span className="text-[#9194A1] text-[10px]">Scope: {c.scope}</span>
                </div>
                <p className="text-[#C7C9D1] font-sans text-xs">{c.description}</p>
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
            <Layers className="w-4 h-4 text-[#CC9166] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Rule Conflict Simulator</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] ${
                  demoConflictPolicy.enabled 
                    ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/30' 
                    : 'bg-[#040406] text-[#9194A1] border border-[#1C1D22]'
                }`}>
                  {demoConflictPolicy.enabled ? 'POL-005 Active (Conflict)' : 'POL-005 Inactive (Nominal)'}
                </span>
              </div>
              <p className="text-[11px] text-[#9194A1] font-sans mt-0.5">
                Toggle rule POL-005 to test contradictory policy handling against POL-001 on 'public_catalogue'.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTogglePolicy('POL-005')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              demoConflictPolicy.enabled
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                : 'bg-[#121317] hover:bg-[#1C1D22] text-[#E2E3E9] border border-[#1C1D22]'
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
          <Search className="w-4 h-4 text-[#9194A1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by name, tool, operation, or resource pattern..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs">
          {(['ALL', 'ALLOW', 'REQUIRE_APPROVAL', 'BLOCK'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-[4px] transition-colors text-xs font-medium ${
                filter === tab
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-[#E2E3E9]'
              }`}
            >
              {tab === 'REQUIRE_APPROVAL' ? 'APPROVAL' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Enforced Rules List */}
      <div className="space-y-3">
        {filtered.map((policy) => (
          <div
            key={policy.id}
            className={`p-4 rounded-[10px] border transition-colors ${
              policy.enabled
                ? 'enterprise-card'
                : 'bg-[#040406]/60 border-[#1C1D22]/60 opacity-60'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[#C7C9D1] font-semibold">
                    {policy.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    {policy.name}
                  </h3>
                  <DecisionBadge decision={policy.decision} size="sm" />
                  <RiskBadge score={policy.risk_score || 70} size="sm" />
                  <span className="text-[10px] font-mono text-[#9194A1]">v{policy.version || 1}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9194A1]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9194A1]">Tool:</span>
                    <span className="text-[#CC9166] font-medium">{policy.tool}</span>
                  </div>
                  <span className="text-[#2E3038]">&bull;</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9194A1]">Operation:</span>
                    <span className="text-[#E2E3E9] font-medium">{policy.operation}</span>
                  </div>
                  <span className="text-[#2E3038]">&bull;</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9194A1]">Target:</span>
                    <span className="text-[#C7C9D1] bg-[#040406] px-2 py-0.5 rounded-[4px] border border-[#1C1D22] text-[11px]">
                      {policy.resource_pattern}
                    </span>
                  </div>
                  {policy.conditions?.amountThreshold && (
                    <>
                      <span className="text-[#2E3038]">&bull;</span>
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <span>Threshold:</span>
                        <span>&gt;${policy.conditions.amountThreshold}</span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-[#C7C9D1] font-sans leading-relaxed">
                  {policy.reason}
                </p>

                {policy.natural_language_source && (
                  <p className="text-[11px] text-[#9194A1] font-sans italic">
                    Authored from: &ldquo;{policy.natural_language_source}&rdquo;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                {onTestPolicy && (
                  <button
                    type="button"
                    onClick={() => onTestPolicy(policy)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#040406] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-[#CC9166] text-xs font-medium transition-colors"
                    title="Load this rule into the Gateway Console to test live evaluation"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onTogglePolicy(policy.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-mono font-medium transition-colors ${
                    policy.enabled
                      ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                      : 'bg-[#040406] border-[#1C1D22] text-[#9194A1] hover:text-white'
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

                {/* Show delete button for dynamically added policies */}
                {parseInt(policy.id.replace('POL-', ''), 10) > 5 && (
                  <button
                    type="button"
                    onClick={() => handleDeletePolicy(policy.id)}
                    className="p-1.5 rounded-[6px] bg-rose-500/[0.08] hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors"
                    title="Revoke / Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

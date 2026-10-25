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
  ArrowRight,
  PlusCircle,
  Check,
  X,
  FileText,
  Sliders,
  Trash2,
  HelpCircle,
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
  'Block all attempts to send confidential files to external destinations.',
  'Require manager approval for payments exceeding $100.',
  'Never allow an agent to delete production database records.',
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
      setTranslationError(err?.message || 'Failed to communicate with natural language interpreter.');
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

  const demoConflictPolicy = policies.find(p => p.id === 'POL-005');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[#CC9166] font-mono text-[11px] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic Policy Authority</span>
          </div>
          <h1 className="text-2xl font-serif text-white tracking-tight font-normal">
            Security Policy Center & Plain-English Rule Studio
          </h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Author and enforce deterministic security rules in ordinary English. Interprets action verbs, tools, and resource patterns into verified server-side policies before activation.
          </p>
        </div>

        {/* Global Policy Baseline Badge */}
        <div className="enterprise-card px-3.5 py-2 flex items-center gap-2.5 self-start sm:self-auto">
          <Lock className="w-4 h-4 text-[#CC9166] shrink-0" />
          <div className="text-xs">
            <div className="text-[#9194A1] text-[10px] uppercase font-mono">Gateway Posture:</div>
            <div className="text-emerald-400 font-mono font-medium text-xs">DENY-BY-DEFAULT</div>
          </div>
        </div>
      </div>

      {/* FEATURE 3: Plain-English Security Policy Builder Card */}
      <div className="enterprise-card p-5 space-y-4 border-[#1C1D22] bg-[#121317]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1D22] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#CC9166]" />
            <h2 className="text-base font-serif text-white font-normal">
              Plain-English Security Policy Builder
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#CC9166] px-2 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] uppercase tracking-wider">
            Deterministic Server-Side NLP Interpreter
          </span>
        </div>

        {/* Quick-fill sample rules */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-[#9194A1] font-medium">Quick-Fill Benchmark Examples:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_NLP_RULES.map((rule, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalLanguageInput(rule);
                  handleInterpretRule(rule);
                }}
                className="px-2.5 py-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] hover:border-[#2E3038] text-[11px] text-[#9194A1] hover:text-[#E2E3E9] transition-all text-left truncate max-w-xs"
                title={rule}
              >
                &ldquo;{rule}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Natural Language Prompt Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#C7C9D1]">
            <label htmlFor="nlpInput" className="font-medium">
              Describe your security rule in natural English:
            </label>
            <span className="text-[11px] text-[#9194A1]">e.g. &ldquo;Require manager approval for payments exceeding $100.&rdquo;</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              id="nlpInput"
              rows={2}
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="Type your plain-English security requirement here..."
              className="flex-1 p-2.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166] font-sans"
            />
            <button
              type="button"
              onClick={() => handleInterpretRule()}
              disabled={isTranslating || !naturalLanguageInput.trim()}
              className="px-4 py-2 rounded-[6px] bg-[#CC9166] hover:bg-[#B87E54] text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 self-end sm:self-auto"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>{isTranslating ? 'Interpreting...' : 'Interpret Rule'}</span>
            </button>
          </div>
        </div>

        {translationError && (
          <div className="p-3 rounded-[6px] bg-rose-500/[0.08] border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{translationError}</span>
          </div>
        )}

        {/* Structured Interpretation Review & Confirmation Stage */}
        {translationResult && (
          <div className="p-4 rounded-[10px] bg-[#040406] border border-[#1C1D22] space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-serif text-white font-normal uppercase tracking-wider">
                  Proposed Structured Interpretation (Review &amp; Edit)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/[0.08] px-2 py-0.5 rounded-[4px] border border-emerald-500/30">
                Confidence: {Math.round(translationResult.confidenceScore * 100)}%
              </span>
            </div>

            {/* Natural language explanation */}
            <p className="text-xs text-[#C7C9D1] bg-[#121317] p-2.5 rounded-[6px] border border-[#1C1D22] font-sans leading-relaxed">
              {translationResult.explanation}
            </p>

            {/* Editable Policy Schema Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Policy Title</label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-sans focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Tool Scope</label>
                <input
                  type="text"
                  value={draftTool}
                  onChange={(e) => setDraftTool(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Operation</label>
                <input
                  type="text"
                  value={draftOperation}
                  onChange={(e) => setDraftOperation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Target Resource Pattern</label>
                <input
                  type="text"
                  value={draftResourcePattern}
                  onChange={(e) => setDraftResourcePattern(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Enforcement Decision</label>
                <select
                  value={draftDecision}
                  onChange={(e) => setDraftDecision(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono focus:outline-none focus:border-[#CC9166] text-xs"
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
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-mono focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-[#9194A1] mb-1">Security Rationale</label>
                <input
                  type="text"
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] text-[#E2E3E9] font-sans focus:outline-none focus:border-[#CC9166] text-xs"
                />
              </div>
            </div>

            {/* Pre-Activation Representative Test Cases */}
            <div className="space-y-2 pt-2 border-t border-[#1C1D22]">
              <span className="text-[10px] font-semibold text-[#9194A1] font-mono uppercase tracking-wider">
                Pre-Activation Verification Scenarios:
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

            {/* Confirmation & Save Controls */}
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
                <span>{isSavingPolicy ? 'Activating...' : 'Confirm & Activate Policy'}</span>
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
            {conflicts.map(c => (
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
          <Search className="w-4 h-4 text-[#9194A1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies by name, tool, operation, or resource pattern..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none focus:border-[#CC9166]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-xs">
          {(['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'] as const).map((tab) => (
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

      {/* Enforced Policies List */}
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
                    <span className="text-[#9194A1]">Target Pattern:</span>
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
                    title="Load this policy into the Gateway Console to test live evaluation"
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
                    title="Revoke / Delete Policy"
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

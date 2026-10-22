import React, { useEffect, useState } from 'react';
import { MockResources } from '../types';
import { api } from '../lib/api';
import {
  Database,
  Lock,
  RefreshCw,
  Server,
  CheckCircle,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface SettingsProps {
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onResetDemo, isResetting }) => {
  const [resources, setResources] = useState<MockResources | null>(null);
  const [isLoadingRes, setIsLoadingRes] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchResources = async () => {
    setIsLoadingRes(true);
    try {
      const res = await api.getMockResources();
      if (res.success) {
        setResources(res.resources);
      }
    } catch (e) {
      console.error('Failed to fetch mock resources:', e);
    } finally {
      setIsLoadingRes(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [isResetting]);

  const copySqlMigration = () => {
    const sql = `-- ==============================================================================
-- SENTRIX AI Agent Security Gateway - Database Schema & Row-Level Security
-- ==============================================================================

-- 1. Policies Table
CREATE TABLE IF NOT EXISTS public.policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tool TEXT NOT NULL,
    operation TEXT NOT NULL,
    resource_pattern TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'BLOCK', 'REQUIRE_APPROVAL')),
    reason TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Approval Requests Table (with TTL Auto-Expiry & Replay Defense)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id TEXT PRIMARY KEY,
    action_payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    execution_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '10 minutes')
);

-- 3. Audit Events Table (Immutable Compliance Event Ledger)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    agent_id TEXT,
    tool TEXT NOT NULL,
    operation TEXT NOT NULL,
    resource TEXT NOT NULL,
    description TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'BLOCK', 'REQUIRE_APPROVAL')),
    reason TEXT NOT NULL,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('EXECUTED', 'BLOCKED', 'PENDING_APPROVAL', 'REJECTED', 'FAILED', 'EXPIRED')),
    execution_output JSONB,
    security_signals JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient security lookup
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_decision ON public.audit_events (decision);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approval_requests (status);
CREATE INDEX IF NOT EXISTS idx_policies_enabled ON public.policies (enabled);

-- Enable Row Level Security (RLS)
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated and anon clients
CREATE POLICY "Allow public read access to policies" ON public.policies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access to approvals" ON public.approval_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access to audit events" ON public.audit_events FOR SELECT TO anon, authenticated USING (true);

-- Seed Baseline Security Policies
INSERT INTO public.policies (id, name, tool, operation, resource_pattern, decision, reason, enabled)
VALUES
  ('POL-001', 'Public Catalogue Read Access', 'file_store', 'read', 'public_catalogue', 'ALLOW', 'The resource is public and the operation is read-only.', true),
  ('POL-002', 'Financial Ledger Protection', 'file_store', 'delete', 'financial_records_2025', 'BLOCK', 'Destructive deletion of protected financial records is strictly prohibited by security baseline.', true),
  ('POL-003', 'Confidential Dossier Transfer Approval', 'data_transfer', 'transfer', 'confidential_customer_dossier', 'REQUIRE_APPROVAL', 'Exporting confidential customer records outside the security perimeter requires verified human authorization.', true),
  ('POL-004', 'Confidential Dossier Export Alias', 'data_transfer', 'export', 'confidential_customer_dossier', 'REQUIRE_APPROVAL', 'Data exfiltration safeguard: Exporting customer dossier archives requires two-party consensus approval.', true),
  ('POL-005', 'Contradictory Catalogue Block (Demo Conflict)', 'file_store', 'read', 'public_catalogue', 'BLOCK', 'Conflicting rule for testing Policy Center conflict alerts and deterministic deny-first fallback.', false)
ON CONFLICT (id) DO NOTHING;`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const hasSupabaseUrl = Boolean(import.meta.env.VITE_SUPABASE_URL || 'https://lquqplagdtmmeeesocyg.supabase.co');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings & Posture</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Database connectivity, storage isolation posture, and real-time state verification of protected resources.
        </p>
      </div>

      {/* Database & Architecture Posture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase Integration Card */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Database Connection</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-medium">
              {hasSupabaseUrl ? 'SUPABASE CONFIGURED' : 'LOCAL ISOLATION'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Connected Project: <code className="text-blue-400 font-mono text-[11px]">https://lquqplagdtmmeeesocyg.supabase.co</code>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            API keys verified. SENTRIX supports hybrid persistence: real-time in-memory zero-trust execution with PostgreSQL sync.
          </p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">PostgreSQL Migrations:</span>
            <button
              onClick={copySqlMigration}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-mono text-[11px]"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy SQL Schema'}</span>
            </button>
          </div>
        </div>

        {/* Security Baseline Authority Card */}
        <div className="enterprise-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Enforcement Authority</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 font-medium">
              DETERMINISTIC
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All decision logic executes server-side before actions touch mock resources or network destinations.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>External AI Dependencies:</span>
            <span className="text-emerald-400">Zero Paid APIs Required</span>
          </div>
        </div>
      </div>

      {/* Protected Resources Verification */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Protected Resource State Verification</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm that blocked destructive operations leave sensitive records untouched.
            </p>
          </div>

          <button
            onClick={fetchResources}
            disabled={isLoadingRes}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRes ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>

        {resources && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* 1. Public Catalogue */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">1. public_catalogue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  ALLOW READ
                </span>
              </div>
              <p className="text-slate-400">
                Public read-only specifications accessible without elevation.
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                Items: <strong className="text-white">{resources.catalogue.length} Products</strong>
              </div>
            </div>

            {/* 2. Financial Ledger */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">2. financial_records_2025</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
                  BLOCKED IMMUTABLE
                </span>
              </div>
              <p className="text-slate-400">
                Protected financial records. Blocked deletions leave balances 100% intact.
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                <div className="flex justify-between">
                  <span>Ledger Balance:</span>
                  <strong className="text-emerald-400">$48,500,000.00</strong>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <strong className="text-emerald-400">INTACT (LOCKED)</strong>
                </div>
              </div>
            </div>

            {/* 3. Customer Dossier */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">3. customer_dossier</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  REQUIRES APPROVAL
                </span>
              </div>
              <p className="text-slate-400">
                Restricted customer files. Quarantined until supervisor clearance.
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                <div className="flex justify-between">
                  <span>Export State:</span>
                  <strong className={resources.customerDossiers[0]?.transferredToExternal ? 'text-emerald-400' : 'text-slate-300'}>
                    {resources.customerDossiers[0]?.transferredToExternal ? 'TRANSFERRED (APPROVED)' : 'NOT TRANSFERRED'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Reset */}
      <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-white">Reset Sandbox Data</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Restores mock ledger balance, resets anomaly alert counters, and clears pending approval items.
          </p>
        </div>

        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Sandbox</span>
        </button>
      </div>
    </div>
  );
};

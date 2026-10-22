-- ==============================================================================
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

-- Read policies for authenticated and anon clients (Gateway reading)
CREATE POLICY "Allow public read access to policies" 
ON public.policies FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to approvals" 
ON public.approval_requests FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to audit events" 
ON public.audit_events FOR SELECT TO anon, authenticated USING (true);

-- Seed Baseline Security Policies
INSERT INTO public.policies (id, name, tool, operation, resource_pattern, decision, reason, enabled)
VALUES
  ('POL-001', 'Public Catalogue Read Access', 'file_store', 'read', 'public_catalogue', 'ALLOW', 'The resource is public and the operation is read-only.', true),
  ('POL-002', 'Financial Ledger Protection', 'file_store', 'delete', 'financial_records_2025', 'BLOCK', 'Destructive deletion of protected financial records is strictly prohibited by security baseline.', true),
  ('POL-003', 'Confidential Dossier Transfer Approval', 'data_transfer', 'transfer', 'confidential_customer_dossier', 'REQUIRE_APPROVAL', 'Exporting confidential customer records outside the security perimeter requires verified human authorization.', true),
  ('POL-004', 'Confidential Dossier Export Alias', 'data_transfer', 'export', 'confidential_customer_dossier', 'REQUIRE_APPROVAL', 'Data exfiltration safeguard: Exporting customer dossier archives requires two-party consensus approval.', true),
  ('POL-005', 'Contradictory Catalogue Block (Demo Conflict)', 'file_store', 'read', 'public_catalogue', 'BLOCK', 'Conflicting rule for testing Policy Center conflict alerts and deterministic deny-first fallback.', false)
ON CONFLICT (id) DO NOTHING;

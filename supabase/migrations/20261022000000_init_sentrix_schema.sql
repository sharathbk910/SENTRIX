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

-- 2. Approval Requests Table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id TEXT PRIMARY KEY,
    action_payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    execution_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Audit Events Table
CREATE TABLE IF NOT EXISTS public.audit_events (
    id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    operation TEXT NOT NULL,
    resource TEXT NOT NULL,
    description TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'BLOCK', 'REQUIRE_APPROVAL')),
    reason TEXT NOT NULL,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('EXECUTED', 'BLOCKED', 'PENDING_APPROVAL', 'REJECTED', 'FAILED')),
    execution_output JSONB,
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

-- Read policies for authenticated clients
CREATE POLICY "Allow read access to policies for authenticated users" 
ON public.policies FOR SELECT TO authenticated USING (true);

-- Privileged execution only via trusted service role
CREATE POLICY "Allow read access to approvals for authenticated users" 
ON public.approval_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to audit events for authenticated users" 
ON public.audit_events FOR SELECT TO authenticated USING (true);

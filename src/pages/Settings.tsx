import React, { useEffect, useState } from 'react';
import { MockResources } from '../types';
import { api } from '../lib/api';
import {
  Shield,
  Lock,
  RefreshCw,
  CheckCircle,
  Eye,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onResetDemo, isResetting }) => {
  const [resources, setResources] = useState<MockResources | null>(null);
  const [isLoadingRes, setIsLoadingRes] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#1C1D22] pb-5">
        <h1 className="font-serif text-2xl text-white tracking-tight">Security Posture &amp; Enforcement</h1>
        <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
          Real-time status of the zero-trust evaluation boundary, resource protection guarantees, and isolation posture.
        </p>
      </div>

      {/* Enforcement & Isolation Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zero-Trust Policy Authority */}
        <div className="enterprise-card p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero-Trust Policy Authority</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 font-medium">
              ACTIVE &amp; ENFORCING
            </span>
          </div>

          <div className="text-xs text-[#C7C9D1] space-y-2 py-1">
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Interception Boundary:</span>
              <span className="font-mono text-[#E2E3E9]">Pre-Execution Server-Side</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Decision Outcomes:</span>
              <span className="font-mono text-emerald-400">ALLOW · BLOCK · REQUIRE_APPROVAL</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Default Action Strategy:</span>
              <span className="font-mono text-[#CC9166]">Strict Deny-by-Default</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#9194A1]">Policy Conflict Resolution:</span>
              <span className="font-mono text-amber-400">Deny-First Fallback</span>
            </div>
          </div>

          <p className="text-xs text-[#9194A1] leading-relaxed pt-1">
            Every autonomous agent action is intercepted, validated, and logged before any downstream tools or mock resources are contacted.
          </p>
        </div>

        {/* Security Isolation & Defense Layers */}
        <div className="enterprise-card p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="w-4 h-4 text-[#CC9166]" />
              <span>Agent Defense &amp; Isolation</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#CC9166]/10 border border-[#CC9166]/30 text-[#CC9166] font-medium">
              DETERMINISTIC
            </span>
          </div>

          <div className="text-xs text-[#C7C9D1] space-y-2 py-1">
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Prompt Injection Shield:</span>
              <span className="font-mono text-[#CC9166]">Heuristic Override Interceptor</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Data Leak Prevention (DLP):</span>
              <span className="font-mono text-rose-300">Outbound Token &amp; Secret Masking</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#1C1D22]">
              <span className="text-[#9194A1]">Anomaly Tripwire:</span>
              <span className="font-mono text-amber-300">3 Repeated Denials &rarr; Alert</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#9194A1]">Human Approval TTL:</span>
              <span className="font-mono text-[#E2E3E9]">10-Minute Auto-Expiry</span>
            </div>
          </div>

          <p className="text-xs text-[#9194A1] leading-relaxed pt-1">
            Protects enterprise data perimeters with zero external paid AI model dependencies or cloud API key risks.
          </p>
        </div>
      </div>

      {/* Protected Resources Verification */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Protected Resource State Verification</h2>
            <p className="text-xs text-[#9194A1] mt-0.5">
              Confirm that blocked destructive operations leave sensitive records untouched.
            </p>
          </div>

          <button
            onClick={fetchResources}
            disabled={isLoadingRes}
            className="px-3 py-1.5 rounded-[8px] bg-[#040406] hover:bg-[#121317] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#C7C9D1] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRes ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>

        {resources && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* 1. Public Catalogue */}
            <div className="p-3.5 rounded-[8px] bg-[#040406] border border-[#1C1D22] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">1. public_catalogue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-emerald-950/20 text-emerald-400 border border-emerald-500/30">
                  ALLOW READ
                </span>
              </div>
              <p className="text-[#9194A1] leading-relaxed">
                Public read-only specifications accessible without elevation.
              </p>
              <div className="p-2.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] font-mono text-[11px] text-[#C7C9D1]">
                Items: <strong className="text-white">{resources.catalogue.length} Products</strong>
              </div>
            </div>

            {/* 2. Financial Ledger */}
            <div className="p-3.5 rounded-[8px] bg-[#040406] border border-[#1C1D22] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">2. financial_records_2025</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-rose-950/20 text-rose-400 border border-rose-500/30">
                  BLOCKED IMMUTABLE
                </span>
              </div>
              <p className="text-[#9194A1] leading-relaxed">
                Protected financial records. Blocked deletions leave balances 100% intact.
              </p>
              <div className="p-2.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] font-mono text-[11px] text-[#C7C9D1] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-[#9194A1]">Ledger Balance:</span>
                  <strong className="text-emerald-400">$48,500,000.00</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9194A1]">Status:</span>
                  <strong className="text-emerald-400">INTACT (LOCKED)</strong>
                </div>
              </div>
            </div>

            {/* 3. Customer Dossier */}
            <div className="p-3.5 rounded-[8px] bg-[#040406] border border-[#1C1D22] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">3. customer_dossier</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-amber-950/20 text-amber-300 border border-amber-500/30">
                  REQUIRES APPROVAL
                </span>
              </div>
              <p className="text-[#9194A1] leading-relaxed">
                Restricted customer files. Quarantined until supervisor clearance.
              </p>
              <div className="p-2.5 rounded-[6px] bg-[#121317] border border-[#1C1D22] font-mono text-[11px] text-[#C7C9D1] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-[#9194A1]">Export State:</span>
                  <strong className={resources.customerDossiers[0]?.transferredToExternal ? 'text-emerald-400' : 'text-[#E2E3E9]'}>
                    {resources.customerDossiers[0]?.transferredToExternal ? 'TRANSFERRED (APPROVED)' : 'NOT TRANSFERRED'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

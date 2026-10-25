import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { SystemStats, EmergencyPauseState } from '../../types';
import { Shield, Activity, RefreshCw, AlertOctagon, Check, X, HelpCircle, BookOpen, CheckCircle2, ArrowRight, Search } from 'lucide-react';
import { RouteId } from './Sidebar';

interface NavbarProps {
  stats: SystemStats | null;
  pauseState: EmergencyPauseState | null;
  onToggleEmergencyPause: (pause: boolean, reason?: string) => Promise<void>;
  onResetDemo: () => void;
  onRouteChange: (route: RouteId) => void;
  onOpenCommandPalette?: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  pauseState,
  onToggleEmergencyPause,
  onResetDemo,
  onRouteChange,
  onOpenCommandPalette,
  isResetting
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');
  const [isTogglingPause, setIsTogglingPause] = useState(false);

  const isPaused = pauseState?.isPaused || false;

  const handlePauseConfirm = async () => {
    setIsTogglingPause(true);
    try {
      await onToggleEmergencyPause(!isPaused, confirmReason || (isPaused ? 'Resumed service' : 'Emergency administrative stop'));
      setShowConfirmModal(false);
      setConfirmReason('');
    } finally {
      setIsTogglingPause(false);
    }
  };

  return (
    <>
      {/* Persistent Emergency Pause Banner across all pages */}
      {isPaused && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>Emergency Agent Pause Active &mdash; All autonomous tool operations are currently halted by administrator.</span>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3 py-1 rounded bg-black/80 hover:bg-black text-white text-xs font-semibold shrink-0"
          >
            Resume Gateway
          </button>
        </div>
      )}

      <header className="h-16 border-b border-[#1C1D22] bg-[#08080A]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Logo size="md" />

          {/* Clean Environment Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#121317] border border-[#1C1D22] text-xs text-[#C7C9D1]">
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            <span className="font-medium text-xs">{isPaused ? 'Gateway: Paused' : 'Gateway: Active'}</span>
            <span className="text-[#2E3038]">&bull;</span>
            <span className="text-[#9194A1] font-mono text-[10px] tracking-wider uppercase">Zero-Trust Enforcement</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Anomaly Alerts Indicator */}
          {(stats?.activeAlertsCount ?? 0) > 0 && (
            <button
              onClick={() => onRouteChange('alerts')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-rose-500/[0.08] border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/15 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{stats?.activeAlertsCount} Alerts</span>
            </button>
          )}

          {/* Quick Search / Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#121317] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#9194A1] hover:text-[#E2E3E9] transition-colors"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#9194A1]" />
              <span className="hidden sm:inline text-[#9194A1]">Quick Actions</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[10px] font-mono text-[#9194A1]">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Quick Guide for Judges / Evaluators */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#CC9166]/10 hover:bg-[#CC9166]/20 border border-[#CC9166]/30 text-xs font-semibold text-[#CC9166] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Guide</span>
          </button>

          {/* Emergency Pause Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-semibold transition-all ${
              isPaused
                ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
                : 'bg-[#121317] hover:bg-rose-950/30 text-[#C7C9D1] hover:text-rose-300 border-[#1C1D22] hover:border-rose-500/40'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>{isPaused ? 'Resume Service' : 'Emergency Stop'}</span>
          </button>

          {/* Reset Sandbox Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset sandbox data and approvals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#121317] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#9194A1] hover:text-[#E2E3E9] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>
        </div>
      </header>

      {/* Evaluator Demo Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] rounded-[10px] border border-[#1C1D22] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
              <div className="flex items-center gap-2 text-white font-serif text-lg font-normal">
                <BookOpen className="w-5 h-5 text-[#CC9166]" />
                <span>SENTRIX &mdash; 60-Second Evaluator Guide</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-[#9194A1] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#C7C9D1]">
              <p className="leading-relaxed">
                SENTRIX is a <strong>deterministic AI Agent Security Gateway</strong> delivering five core safety controls for autonomous systems:
              </p>

              <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
                <div className="p-3 rounded-[8px] bg-[#08080A] border border-rose-500/20 space-y-1">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Feature 1 &bull; Live Attack Demonstration</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Interactive prompt injection & exfiltration attack scenario with side-by-side comparison (Unprotected vs SENTRIX Protected).
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-[#1C1D22] space-y-1">
                  <div className="font-semibold text-[#CC9166] flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Feature 2 &bull; Real-Time Action Dashboard</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Live telemetry feed with risk scores, matched policies, decision badges, and real-time polling.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-[#1C1D22] space-y-1">
                  <div className="font-semibold text-[#E2E3E9] flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Feature 3 &bull; Plain-English Policy Builder</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Author rules in ordinary English. Converts into structured policies with pre-activation test validation.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-amber-500/20 space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Feature 4 &bull; Human Approval Workflow</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Guarantees quarantined actions cannot execute without human clearance. Auto-expiry TTL and replay protection.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-emerald-500/20 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Feature 5 &bull; Tamper-Evident Audit Ledger</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    SHA-256 cryptographic hash chaining linked to Genesis. Verify Integrity button and CSV/JSON export.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C1D22] flex items-center justify-between">
              <span className="text-[10px] text-[#9194A1] font-mono uppercase tracking-wider">PS 2.1 AI Agent Safety</span>
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  onRouteChange('attack-demo');
                }}
                className="px-3.5 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Launch Attack Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] rounded-[10px] border border-[#1C1D22] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
              <div className="flex items-center gap-2 text-white font-serif text-lg font-normal">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <span>Confirm {isPaused ? 'Resume Gateway' : 'Emergency Agent Stop'}</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-[#9194A1] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#C7C9D1] leading-relaxed">
              {isPaused ? (
                <>
                  Resuming the gateway will restore normal agent action processing and deterministic policy enforcement.
                </>
              ) : (
                <>
                  Activating the Emergency Stop triggers a server-enforced halt on all autonomous tool calls across the platform.
                </>
              )}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-[#9194A1] font-medium">
                Reason / Note:
              </label>
              <input
                type="text"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder={isPaused ? "e.g. Incident verified and cleared" : "e.g. Investigating unexpected behavior"}
                className="w-full px-3 py-2 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[#E2E3E9] text-xs focus:outline-none focus:border-[#CC9166]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#08080A] text-[#9194A1] hover:text-white text-xs border border-[#1C1D22] hover:border-[#2E3038] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseConfirm}
                disabled={isTogglingPause}
                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isPaused ? 'Confirm Resume' : 'Confirm Stop'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

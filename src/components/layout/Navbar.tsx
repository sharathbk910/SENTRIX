import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { SystemStats, EmergencyPauseState } from '../../types';
import {
  Shield,
  Activity,
  RefreshCw,
  AlertOctagon,
  Check,
  X,
  Menu,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Search
} from 'lucide-react';
import { RouteId } from './Sidebar';

interface NavbarProps {
  stats: SystemStats | null;
  pauseState: EmergencyPauseState | null;
  onToggleEmergencyPause: (pause: boolean, reason?: string) => Promise<void>;
  onResetDemo: () => void;
  onRouteChange: (route: RouteId) => void;
  onOpenCommandPalette?: () => void;
  isResetting: boolean;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  pauseState,
  onToggleEmergencyPause,
  onResetDemo,
  onRouteChange,
  onOpenCommandPalette,
  isResetting,
  onToggleMobileMenu,
  isMobileMenuOpen = false
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
        <div className="bg-rose-600 text-white px-3 sm:px-4 py-2 text-xs font-medium flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="truncate">Emergency Pause Active &mdash; Agent operations halted.</span>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-2.5 py-1 rounded bg-black/80 hover:bg-black text-white text-xs font-semibold shrink-0"
          >
            Resume
          </button>
        </div>
      )}

      <header className="h-16 border-b border-[#1C1D22] bg-[#08080A]/90 backdrop-blur-md px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5 sm:gap-6">
          {/* Mobile Menu Hamburger Toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-[6px] bg-[#121317] hover:bg-[#17181F] border border-[#1C1D22] text-[#E2E3E9] focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-[#CC9166]" />
              ) : (
                <Menu className="w-4 h-4 text-[#CC9166]" />
              )}
            </button>
          )}

          <Logo size="md" className="hidden sm:flex" />
          <Logo size="sm" className="sm:hidden" />

          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#121317] border border-[#1C1D22] text-xs text-[#C7C9D1]">
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            <span className="font-medium text-xs">{isPaused ? 'Protection: Paused' : 'Protection: Active'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Anomaly Alerts Indicator */}
          {(stats?.activeAlertsCount ?? 0) > 0 && (
            <button
              onClick={() => onRouteChange('alerts')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-[6px] bg-rose-500/[0.08] border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/15 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="hidden sm:inline">{stats?.activeAlertsCount} Alerts</span>
              <span className="sm:hidden">{stats?.activeAlertsCount}</span>
            </button>
          )}

          {/* Quick Search / Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[#121317] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#9194A1] hover:text-[#E2E3E9] transition-colors"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#9194A1]" />
              <span className="hidden sm:inline text-[#9194A1]">Quick Actions</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[10px] font-mono text-[#9194A1]">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* System Architecture Guide Modal */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-[6px] bg-[#CC9166]/10 hover:bg-[#CC9166]/20 border border-[#CC9166]/30 text-xs font-semibold text-[#CC9166] transition-colors"
            title="System Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System Guide</span>
          </button>

          {/* Emergency Pause Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-[6px] border text-xs font-semibold transition-all ${
              isPaused
                ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
                : 'bg-[#121317] hover:bg-rose-950/30 text-[#C7C9D1] hover:text-rose-300 border-[#1C1D22] hover:border-rose-500/40'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>{isPaused ? 'Resume' : 'Emergency Stop'}</span>
          </button>

          {/* Reset Sandbox Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset sandbox data and approvals"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#121317] hover:bg-[#17181F] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#9194A1] hover:text-[#E2E3E9] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Reset Sandbox</span>
          </button>
        </div>
      </header>

      {/* System Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] rounded-[10px] border border-[#1C1D22] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
              <div className="flex items-center gap-2 text-white font-serif text-lg font-normal">
                <BookOpen className="w-5 h-5 text-[#CC9166]" />
                <span>SENTRIX Architecture &amp; Controls</span>
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
                SENTRIX enforces deterministic, pre-execution security controls across all autonomous AI agent operations:
              </p>

              <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
                <div className="p-3 rounded-[8px] bg-[#08080A] border border-rose-500/20 space-y-1">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>1. Adversarial Containment</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Evaluates prompt injections, dangerous system overrides, and data exfiltration payloads before execution.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-[#1C1D22] space-y-1">
                  <div className="font-semibold text-[#CC9166] flex items-center gap-1.5 font-mono text-[11px]">
                    <span>2. Real-Time Telemetry Feed</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Continuous stream of intercepted agent requests, computed risk scores, and enforced policy verdicts.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-[#1C1D22] space-y-1">
                  <div className="font-semibold text-[#E2E3E9] flex items-center gap-1.5 font-mono text-[11px]">
                    <span>3. Natural Language Policy Engine</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Compiles human-readable guidelines into structured validation criteria with conflict detection.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-amber-500/20 space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>4. Human-in-the-Loop Quarantine</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    Holds high-risk operations in quarantine pending cryptographic approval tokens and supervisor authorization.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#08080A] border border-emerald-500/20 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>5. Tamper-Evident Audit Ledger</span>
                  </div>
                  <p className="text-[#9194A1] text-[11px] leading-relaxed">
                    SHA-256 forward hash chain guaranteeing unforgeable, chronologically validated forensic records.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C1D22] flex items-center justify-between">
              <span className="text-[10px] text-[#9194A1] font-mono uppercase tracking-wider">Zero-Trust Isolation Layer</span>
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  onRouteChange('attack-demo');
                }}
                className="px-3.5 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Threat Simulation</span>
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

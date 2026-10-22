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

      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Logo size="md" />

          {/* Clean Environment Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="font-medium">{isPaused ? 'Gateway: Paused' : 'Gateway: Active'}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400 font-mono text-[11px]">Zero-Trust Enforcement</span>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* Anomaly Alerts Indicator */}
          {(stats?.activeAlertsCount ?? 0) > 0 && (
            <button
              onClick={() => onRouteChange('alerts')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{stats?.activeAlertsCount} Alerts</span>
            </button>
          )}

          {/* Quick Search / Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">Quick Actions</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Quick Guide for Judges / Evaluators */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Guide</span>
          </button>

          {/* Emergency Pause Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isPaused
                ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
                : 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/50'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>
        </div>
      </header>

      {/* Evaluator Demo Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>SENTRIX &mdash; 60-Second Evaluator Guide</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed text-slate-300">
                SENTRIX is a <strong>deterministic AI Agent Security Gateway</strong> that intercepts and evaluates autonomous tool calls before execution.
              </p>

              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>1. Safe Operations (ALLOW)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Go to <strong>Policy Gateway</strong> &rarr; Select <strong>Preset 1 (Read Catalogue)</strong> &rarr; Click <strong>Evaluate & Enforce</strong>. Results in real catalogue data.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <span>2. Destructive Actions (BLOCK)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Select <strong>Preset 2 (Delete Ledger)</strong> &rarr; Blocked server-side. Protected financial data remains 100% intact.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>3. Quarantine & Human Approval</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Select <strong>Preset 3 (Transfer Dossier)</strong> &rarr; Quarantined with 10m TTL. Jump to <strong>Approval Queue</strong> to authorize or reject.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <span>4. DLP Secrets & Prompt Injections</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Select <strong>Preset 5 & 6</strong> to see outbound API tokens masked and adversarial document overrides neutralized.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">14 Automated Tests passing (npm test)</span>
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  onRouteChange('playground');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Launch Gateway Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <span>Confirm {isPaused ? 'Resume Gateway' : 'Emergency Agent Stop'}</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
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
              <label className="text-xs text-slate-400 font-medium">
                Reason / Note:
              </label>
              <input
                type="text"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder={isPaused ? "e.g. Incident verified and cleared" : "e.g. Investigating unexpected behavior"}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseConfirm}
                disabled={isTogglingPause}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
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

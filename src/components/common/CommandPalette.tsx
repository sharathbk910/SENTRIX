import React, { useState, useEffect } from 'react';
import { RouteId } from '../layout/Sidebar';
import {
  Search,
  LayoutDashboard,
  Terminal,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Settings,
  Sparkles,
  AlertOctagon,
  X,
  ArrowRight,
  Shield,
  FileKey
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteChange: (route: RouteId) => void;
  onQuickRunScenario: (idx: number) => Promise<void>;
  onToggleEmergencyPause: (pause: boolean, reason?: string) => Promise<void>;
  isPaused: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onRouteChange,
  onQuickRunScenario,
  onToggleEmergencyPause,
  isPaused
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { id: 'attack-demo', label: 'Live Attack Demonstration & Exfiltration Containment', icon: ShieldAlert },
    { id: 'dashboard', label: 'Dashboard & Live Telemetry', icon: LayoutDashboard },
    { id: 'playground', label: 'Policy Gateway Console (Workbench)', icon: Terminal },
    { id: 'approvals', label: 'Quarantine Approvals Queue', icon: Clock },
    { id: 'alerts', label: 'Security Anomaly Alerts', icon: ShieldAlert },
    { id: 'policies', label: 'Security Rules — Allowed, Blocked & Approval Rules', icon: ShieldCheck },
    { id: 'audit', label: 'Tamper-Evident Audit Ledger (SHA-256)', icon: FileText },
    { id: 'settings', label: 'System Configuration & Security Posture', icon: Settings }
  ];

  const scenarios = [
    { idx: 0, label: 'Run Safe Read (ALLOW)', tag: 'Normal Read', desc: 'Read public product catalogue' },
    { idx: 1, label: 'Run Block Delete (BLOCK)', tag: 'Destructive', desc: 'Attempt to delete 2025 financial ledger' },
    { idx: 2, label: 'Run Quarantine Transfer (REQUIRE_APPROVAL)', tag: 'TTL Quarantined', desc: 'Transfer confidential customer dossier' },
    { idx: 3, label: 'Run Deny-by-Default (BLOCK)', tag: 'Unknown Tool', desc: 'Execute unregistered internal cluster utility' },
    { idx: 4, label: 'Run DLP Secret Leak (BLOCK)', tag: 'Secret Intercepted', desc: 'Exfiltrate payload containing API credential token' },
    { idx: 5, label: 'Run Prompt Injection Attack (BLOCK)', tag: 'Adversarial Prompt', desc: 'Inject instruction override in untrusted document' },
    { idx: 6, label: 'Run Fuzzing Anomaly Burst', tag: 'Anomaly Spike', desc: 'Probe system shell to trigger sliding window alert' }
  ];

  const filteredNav = navItems.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase()) ||
      s.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-[#121317] border border-[#1C1D22] rounded-[10px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#1C1D22] flex items-center gap-3 bg-[#040406]">
          <Search className="w-4 h-4 text-[#9194A1] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (e.g., 'approvals', 'dlp', 'pause')"
            className="w-full bg-transparent text-sm text-[#E2E3E9] placeholder-[#9194A1] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-[#9194A1] hover:text-white p-1 rounded-[4px] hover:bg-[#121317] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Results */}
        <div className="p-3 overflow-y-auto space-y-4 text-xs">
          {/* Quick Scenarios */}
          {filteredScenarios.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-[#9194A1]">
                1-Click Verification Scenarios
              </div>
              <div className="space-y-1">
                {filteredScenarios.map((s) => (
                  <button
                    key={s.idx}
                    onClick={async () => {
                      onClose();
                      await onQuickRunScenario(s.idx);
                    }}
                    className="w-full p-2.5 rounded-[6px] hover:bg-[#17181F] border border-transparent hover:border-[#2E3038] text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#CC9166] shrink-0 group-hover:scale-105 transition-transform" />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{s.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[#C7C9D1]">
                            {s.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9194A1] mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9194A1] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-[#9194A1]">
                Navigation
              </div>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onRouteChange(item.id as RouteId);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-[6px] hover:bg-[#17181F] border border-transparent hover:border-[#2E3038] text-left transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#CC9166] shrink-0" />
                        <span className="font-medium text-[#C7C9D1] group-hover:text-white">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#9194A1] group-hover:text-[#C7C9D1]">
                        Go &rarr;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emergency Controls */}
          <div className="space-y-1 pt-1 border-t border-[#1C1D22]">
            <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-[#9194A1]">
              Emergency Administrative Action
            </div>
            <button
              onClick={async () => {
                onClose();
                await onToggleEmergencyPause(!isPaused, isPaused ? 'Resumed from Command Palette' : 'Emergency Stop from Command Palette');
              }}
              className="w-full p-2.5 rounded-[6px] hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 text-left transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-rose-300">
                  {isPaused ? 'Resume Gateway Execution' : 'Activate Emergency Kill Switch (Hard-Stop)'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-rose-500/[0.08] text-rose-400 border border-rose-500/30">
                {isPaused ? 'Currently Paused' : 'Ready'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-[#1C1D22] bg-[#040406] text-[11px] text-[#9194A1] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>Esc to close</span>
            <span>&bull;</span>
            <span>Ctrl + K anywhere</span>
          </div>
          <span className="text-[#9194A1] font-mono text-[10px]">SENTRIX AI Safety System</span>
        </div>
      </div>
    </div>
  );
};

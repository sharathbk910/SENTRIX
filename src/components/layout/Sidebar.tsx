import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  ShieldCheck,
  UserCheck,
  FileText,
  Sliders,
  AlertTriangle,
  Lock,
  ShieldAlert,
  X
} from 'lucide-react';
import { Logo } from '../common/Logo';

export type RouteId =
  | 'dashboard'
  | 'attack-demo'
  | 'playground'
  | 'policies'
  | 'approvals'
  | 'alerts'
  | 'audit'
  | 'settings';

export interface SidebarProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  pendingApprovalsCount: number;
  activeAlertsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: RouteId;
  label: string;
  icon: any;
  badge: string | null;
  badgeAlert?: boolean;
  badgeCritical?: boolean;
  description: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  pendingApprovalsCount,
  activeAlertsCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const coreFeaturesNav: NavItem[] = [
    {
      id: 'attack-demo',
      label: 'Live Attack Demo',
      icon: ShieldAlert,
      badge: 'DEMO 1',
      badgeAlert: true,
      description: 'Prompt Injection Defense'
    },
    {
      id: 'dashboard' as RouteId,
      label: 'Real-Time Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Agent Action Feed & KPIs'
    },
    {
      id: 'policies' as RouteId,
      label: 'Security Rules',
      icon: ShieldCheck,
      badge: null,
      description: 'Protection Rules & Validation'
    },
    {
      id: 'approvals' as RouteId,
      label: 'Approval Queue',
      icon: UserCheck,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeAlert: pendingApprovalsCount > 0,
      description: 'Human Clearance with TTL'
    },
    {
      id: 'audit' as RouteId,
      label: 'Audit Ledger',
      icon: FileText,
      badge: 'SHA-256',
      description: 'Tamper-Evident Hash Chain'
    }
  ];

  const toolsNav: NavItem[] = [
    {
      id: 'playground',
      label: 'Policy Console',
      icon: Terminal,
      badge: null,
      description: 'Workbench & Payload Fuzzer'
    },
    {
      id: 'alerts',
      label: 'Security Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null,
      badgeCritical: activeAlertsCount > 0,
      description: 'Behavior Anomaly Detection'
    },
    {
      id: 'settings',
      label: 'Security Posture',
      icon: Sliders,
      badge: null,
      description: 'Enforcement & Isolation'
    }
  ];

  const handleNavClick = (id: RouteId) => {
    onRouteChange(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div>
      <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#9194A1] mb-2 font-mono">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2 rounded-[6px] text-xs transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-[#121317] text-white border border-[#2E3038] font-medium shadow-sm'
                  : 'text-[#9194A1] hover:text-[#E2E3E9] hover:bg-[#121317]/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-[#CC9166]' : 'text-[#9194A1] group-hover:text-[#C7C9D1]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] shrink-0 border tracking-wider ${
                    item.badgeAlert
                      ? 'bg-rose-500/[0.08] text-rose-300 border-rose-500/30 font-semibold'
                      : item.badgeCritical
                      ? 'bg-amber-500/[0.08] text-amber-300 border-amber-500/30 font-semibold'
                      : 'bg-[#08080A] text-[#9194A1] border-[#1C1D22]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Only visible on md: and up) */}
      <aside className="hidden md:block w-64 bg-[#040406] border-r border-[#1C1D22] p-4 space-y-6 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        {renderNavGroup('Core Capabilities', coreFeaturesNav)}
        {renderNavGroup('Security Tools', toolsNav)}

        {/* Gateway Status Indicator */}
        <div className="p-3 rounded-[8px] bg-[#121317] border border-[#1C1D22] flex items-center justify-between text-[11px] font-mono text-[#9194A1]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#E2E3E9] font-medium">Fail-Closed Gateway</span>
          </div>
          <span className="text-[#CC9166] font-semibold text-[10px]">Zero-Trust</span>
        </div>
      </aside>

      {/* Mobile Off-Canvas Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[#040406] border-r border-[#1C1D22] p-4 space-y-5 overflow-y-auto shadow-2xl transition-transform duration-200 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Logo & Close Button */}
        <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
          <Logo size="sm" />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-[6px] text-[#9194A1] hover:text-white hover:bg-[#121317] border border-transparent hover:border-[#1C1D22] transition-colors"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5 text-[#9194A1]" />
          </button>
        </div>

        {renderNavGroup('Core Capabilities', coreFeaturesNav)}
        {renderNavGroup('Security Tools', toolsNav)}

        {/* Gateway Status Indicator */}
        <div className="p-3 rounded-[8px] bg-[#121317] border border-[#1C1D22] flex items-center justify-between text-[11px] font-mono text-[#9194A1]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#E2E3E9] font-medium">Fail-Closed Gateway</span>
          </div>
          <span className="text-[#CC9166] font-semibold text-[10px]">Zero-Trust</span>
        </div>
      </div>
    </>
  );
};

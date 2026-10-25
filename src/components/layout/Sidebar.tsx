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
  ShieldAlert
} from 'lucide-react';

export type RouteId =
  | 'dashboard'
  | 'attack-demo'
  | 'playground'
  | 'policies'
  | 'approvals'
  | 'alerts'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  pendingApprovalsCount: number;
  activeAlertsCount?: number;
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
  activeAlertsCount = 0
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
      label: 'Security Policies',
      icon: ShieldCheck,
      badge: 'NLP Studio',
      description: 'Plain-English Policy Rules'
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
              onClick={() => onRouteChange(item.id)}
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
    <aside className="w-full md:w-64 bg-[#040406] border-r border-[#1C1D22] p-4 space-y-6 shrink-0">
      {renderNavGroup('Core Capabilities', coreFeaturesNav)}
      {renderNavGroup('Security Tools', toolsNav)}

      {/* Security Architecture Box */}
      <div className="p-3.5 rounded-[10px] bg-[#121317] border border-[#1C1D22] space-y-2">
        <div className="flex items-center gap-2 text-[#E2E3E9] font-medium text-xs">
          <Lock className="w-3.5 h-3.5 text-[#CC9166]" />
          <span>Zero-Trust Gateway</span>
        </div>
        <p className="text-[11px] text-[#9194A1] leading-relaxed font-sans">
          All autonomous agent requests are intercepted, validated, and hashed before reaching mock resources.
        </p>
        <div className="pt-2 border-t border-[#1C1D22] flex items-center justify-between text-[10px] font-mono text-[#9194A1]">
          <span>Boundary: Pre-Exec</span>
          <span className="text-emerald-400 font-semibold">Fail-Closed</span>
        </div>
      </div>
    </aside>
  );
};

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
  ChevronRight
} from 'lucide-react';

export type RouteId = 'dashboard' | 'playground' | 'policies' | 'approvals' | 'alerts' | 'audit' | 'settings';

interface SidebarProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  pendingApprovalsCount: number;
  activeAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  pendingApprovalsCount,
  activeAlertsCount = 0
}) => {
  const platformNav = [
    {
      id: 'dashboard' as RouteId,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
      description: 'Metrics & Live Stream'
    },
    {
      id: 'playground' as RouteId,
      label: 'Policy Gateway',
      icon: Terminal,
      badge: null,
      description: 'Action Evaluation Console'
    },
    {
      id: 'policies' as RouteId,
      label: 'Security Policies',
      icon: ShieldCheck,
      badge: '5 Rules',
      description: 'Deterministic Enforcement'
    },
  ];

  const governanceNav = [
    {
      id: 'approvals' as RouteId,
      label: 'Approval Queue',
      icon: UserCheck,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : null,
      badgeAlert: pendingApprovalsCount > 0,
      description: 'Human-in-the-Loop Clearance'
    },
    {
      id: 'alerts' as RouteId,
      label: 'Security Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount} Active` : null,
      badgeCritical: activeAlertsCount > 0,
      description: 'Behavior Anomaly Detection'
    },
    {
      id: 'audit' as RouteId,
      label: 'Audit Trail',
      icon: FileText,
      badge: null,
      description: 'Immutable Event Ledger'
    },
    {
      id: 'settings' as RouteId,
      label: 'Settings & Database',
      icon: Sliders,
      badge: null,
      description: 'Storage & System Health'
    }
  ];

  const renderNavGroup = (title: string, items: typeof platformNav) => (
    <div>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
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
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between text-xs font-medium ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    (item as any).badgeCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : (item as any).badgeAlert
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
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
    <aside className="w-60 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {renderNavGroup('Platform', platformNav)}
        {renderNavGroup('Governance & Audit', governanceNav)}
      </div>

      {/* Clean Enterprise Trust Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <div className="font-medium text-slate-300">Enforcement Engine</div>
            <div className="text-[11px] text-slate-500">Deterministic Zero-Trust</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

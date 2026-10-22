import React from 'react';
import { PolicyDecision, ExecutionStatus } from '../../types';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface DecisionBadgeProps {
  decision: PolicyDecision;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    ALLOW: {
      bg: 'bg-emerald-950/40 border-emerald-600/30 text-emerald-400',
      icon: ShieldCheck,
      label: 'ALLOW',
      dot: 'bg-emerald-500'
    },
    BLOCK: {
      bg: 'bg-rose-950/40 border-rose-600/30 text-rose-400',
      icon: ShieldAlert,
      label: 'BLOCK',
      dot: 'bg-rose-500'
    },
    REQUIRE_APPROVAL: {
      bg: 'bg-amber-950/40 border-amber-600/30 text-amber-300',
      icon: Clock,
      label: 'REQUIRE APPROVAL',
      dot: 'bg-amber-400'
    }
  };

  const config = configs[decision] || configs.BLOCK;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wide uppercase transition-colors ${config.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

interface ExecutionBadgeProps {
  status: ExecutionStatus;
  size?: 'sm' | 'md';
}

export const ExecutionBadge: React.FC<ExecutionBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const configs: Record<ExecutionStatus, { bg: string; text: string; label: string; icon: any }> = {
    EXECUTED: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      label: 'EXECUTED',
      icon: CheckCircle2
    },
    BLOCKED: {
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-400',
      label: 'BLOCKED',
      icon: XCircle
    },
    PENDING_APPROVAL: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-300',
      label: 'PENDING APPROVAL',
      icon: Clock
    },
    REJECTED: {
      bg: 'bg-slate-800 border-slate-700',
      text: 'text-slate-400',
      label: 'REJECTED',
      icon: AlertCircle
    },
    FAILED: {
      bg: 'bg-rose-950/30 border-rose-800/40',
      text: 'text-rose-400',
      label: 'FAILED',
      icon: AlertCircle
    },
    EXPIRED: {
      bg: 'bg-slate-800 border-slate-700',
      text: 'text-slate-400',
      label: 'EXPIRED',
      icon: Clock
    }
  };

  const config = configs[status] || configs.FAILED;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-[11px] px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded border font-mono font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

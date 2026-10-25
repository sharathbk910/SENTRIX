import React from 'react';
import { PolicyDecision, ExecutionStatus, RiskLevel } from '../../types';
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
      bg: 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      label: 'ALLOW',
      dot: 'bg-emerald-400'
    },
    BLOCK: {
      bg: 'bg-rose-500/[0.08] border-rose-500/30 text-rose-400',
      icon: ShieldAlert,
      label: 'BLOCK',
      dot: 'bg-rose-500'
    },
    REQUIRE_APPROVAL: {
      bg: 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300',
      icon: Clock,
      label: 'REQUIRE APPROVAL',
      dot: 'bg-amber-400'
    }
  };

  const config = configs[decision] || configs.BLOCK;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-medium tracking-wider',
    md: 'text-[11px] px-2.5 py-1 gap-1.5 font-semibold tracking-wider',
    lg: 'text-xs px-3 py-1.5 gap-2 font-semibold tracking-wider',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-[6px] border font-mono uppercase transition-colors ${config.bg} ${sizeClasses[size]}`}
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
      bg: 'bg-emerald-500/[0.08] border-emerald-500/25',
      text: 'text-emerald-400',
      label: 'EXECUTED',
      icon: CheckCircle2
    },
    BLOCKED: {
      bg: 'bg-rose-500/[0.08] border-rose-500/25',
      text: 'text-rose-400',
      label: 'BLOCKED',
      icon: XCircle
    },
    PENDING_APPROVAL: {
      bg: 'bg-amber-500/[0.08] border-amber-500/25',
      text: 'text-amber-300',
      label: 'PENDING APPROVAL',
      icon: Clock
    },
    REJECTED: {
      bg: 'bg-[#121317] border-[#1C1D22]',
      text: 'text-[#9194A1]',
      label: 'REJECTED',
      icon: AlertCircle
    },
    FAILED: {
      bg: 'bg-rose-500/[0.08] border-rose-500/25',
      text: 'text-rose-400',
      label: 'FAILED',
      icon: AlertCircle
    },
    EXPIRED: {
      bg: 'bg-[#121317] border-[#1C1D22]',
      text: 'text-[#9194A1]',
      label: 'EXPIRED',
      icon: Clock
    }
  };

  const config = configs[status] || configs.FAILED;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[9px] px-2 py-0.5 gap-1 tracking-wider' : 'text-[10px] px-2.5 py-1 gap-1.5 tracking-wider';

  return (
    <span className={`inline-flex items-center rounded-[6px] border font-mono font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export interface RiskBadgeProps {
  score?: number;
  level?: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score = 50, level, size = 'sm' }) => {
  const resolvedLevel = level || (score >= 90 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');

  const styles: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
    CRITICAL: { bg: 'bg-rose-500/[0.08] border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
    HIGH: { bg: 'bg-amber-500/[0.08] border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-400' },
    MEDIUM: { bg: 'bg-[#CC9166]/[0.08] border-[#CC9166]/30', text: 'text-[#CC9166]', dot: 'bg-[#CC9166]' },
    LOW: { bg: 'bg-emerald-500/[0.08] border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' }
  };

  const style = styles[resolvedLevel];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold ${style.bg} ${style.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{resolvedLevel} ({score})</span>
    </span>
  );
};

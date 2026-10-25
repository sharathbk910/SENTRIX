import React, { useState } from 'react';
import { BehaviorAnomalyAlert } from '../types';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Clock,
  User,
  Check,
  Activity,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface AlertsProps {
  alerts: BehaviorAnomalyAlert[];
  onResolveAlert: (id: string) => Promise<void>;
  onRouteChange: (route: RouteId) => void;
  onGenerateSampleAlert?: () => Promise<void>;
  isLoading: boolean;
}

export const Alerts: React.FC<AlertsProps> = ({
  alerts,
  onResolveAlert,
  onRouteChange,
  onGenerateSampleAlert,
  isLoading
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');

  const filtered = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1D22] pb-5">
        <div>
          <h1 className="font-serif text-2xl text-white tracking-tight">Security Anomaly Alerts</h1>
          <p className="text-xs text-[#9194A1] mt-1 max-w-2xl leading-relaxed">
            Statistical behavioral monitoring for repeated denial spikes (&ge;3 blocked attempts in 5 minutes) and automated tool bursts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onGenerateSampleAlert && (
            <button
              onClick={async () => {
                await onGenerateSampleAlert();
                setFilter('ACTIVE');
              }}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Anomaly Spike</span>
            </button>
          )}

          {/* Filter Tabs */}
          <div className="flex p-1 rounded-[8px] bg-[#040406] border border-[#1C1D22] text-xs font-medium">
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors flex items-center gap-1.5 ${
                filter === 'ACTIVE'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Active ({activeCount})</span>
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors flex items-center gap-1.5 ${
                filter === 'RESOLVED'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resolved ({alerts.length - activeCount})</span>
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors ${
                filter === 'ALL'
                  ? 'bg-[#121317] text-white font-semibold border border-[#2E3038]'
                  : 'text-[#9194A1] hover:text-white'
              }`}
            >
              <span>All ({alerts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filtered.length === 0 ? (
        <div className="enterprise-card p-12 text-center space-y-3">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/70" />
          <h3 className="text-sm font-semibold text-white">
            {filter === 'ACTIVE' ? 'No Active Anomaly Alerts' : 'No Alerts in this View'}
          </h3>
          <p className="text-xs text-[#9194A1] max-w-md mx-auto leading-relaxed">
            {filter === 'ACTIVE'
              ? 'All agents are currently within safe operational limits. You can trigger repeated blocked calls in the Policy Gateway to test anomaly threshold alerting.'
              : 'Alerts you mark as resolved will appear here.'}
          </p>
          {filter === 'ACTIVE' && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {onGenerateSampleAlert && (
                <button
                  onClick={async () => {
                    await onGenerateSampleAlert();
                    setFilter('ACTIVE');
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-[8px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Anomaly Spike</span>
                </button>
              )}
              <button
                onClick={() => onRouteChange('playground')}
                className="px-3.5 py-2 rounded-[8px] bg-[#121317] hover:bg-[#1C1D22] border border-[#1C1D22] hover:border-[#2E3038] text-xs text-[#C7C9D1] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Test in Policy Gateway</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9194A1]" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-[10px] border transition-colors ${
                alert.status === 'ACTIVE'
                  ? alert.severity === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : 'border-amber-500/40 bg-amber-950/20'
                  : 'bg-[#121317]/40 border-[#1C1D22] opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-[4px] bg-[#040406] border border-[#1C1D22] text-[#C7C9D1]">
                      {alert.id}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-[4px] ${
                        alert.status === 'ACTIVE'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {alert.status}
                    </span>
                    <span className="text-xs text-[#9194A1] font-mono">
                      Detected: {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{alert.title}</span>
                    <span className="text-xs font-normal text-[#9194A1] font-mono">
                      (Sliding Window: {alert.windowSeconds / 60}m)
                    </span>
                  </h3>

                  <p className="text-xs text-[#C7C9D1] leading-relaxed font-sans">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[#C7C9D1]">
                      <User className="w-3.5 h-3.5 text-[#CC9166]" />
                      <span>Target Agent:</span>
                      <strong className="text-white font-mono">{alert.agentId}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-[#C7C9D1]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Denied Operations:</span>
                      <strong className="text-rose-400 font-mono">{alert.attemptCount}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-[#9194A1] bg-[#040406] p-3 rounded-[6px] border border-[#1C1D22]">
                    <span className="text-[#9194A1]/80 font-mono">Latest Reason: </span>
                    <span className="text-[#E2E3E9]">{alert.latestReason}</span>
                  </div>
                </div>

                {alert.status === 'ACTIVE' && (
                  <div className="shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      disabled={isLoading}
                      className="px-3.5 py-2 rounded-[8px] bg-[#121317] hover:bg-[#1C1D22] border border-[#1C1D22] hover:border-[#2E3038] text-[#C7C9D1] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

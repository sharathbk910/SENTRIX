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
  ArrowRight
} from 'lucide-react';
import { RouteId } from '../components/layout/Sidebar';

interface AlertsProps {
  alerts: BehaviorAnomalyAlert[];
  onResolveAlert: (id: string) => Promise<void>;
  onRouteChange: (route: RouteId) => void;
  isLoading: boolean;
}

export const Alerts: React.FC<AlertsProps> = ({
  alerts,
  onResolveAlert,
  onRouteChange,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Anomaly Alerts</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Statistical behavioral monitoring for repeated denial spikes (&ge;3 blocked attempts in 5 minutes) and automated tool bursts.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'ACTIVE'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'RESOLVED'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolved ({alerts.length - activeCount})</span>
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All ({alerts.length})</span>
          </button>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-300">Statistical Baseline:</strong> Alerts represent suspicious automated denial spikes within a sliding window. Review details and resolve when investigation is completed.
        </div>
      </div>

      {/* Alerts List */}
      {filtered.length === 0 ? (
        <div className="enterprise-card p-12 text-center space-y-3">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/70" />
          <h3 className="text-sm font-semibold text-slate-200">
            {filter === 'ACTIVE' ? 'No Active Anomaly Alerts' : 'No Alerts in this View'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filter === 'ACTIVE'
              ? 'All agents are currently within safe operational limits. You can trigger repeated blocked calls in the Policy Gateway to test anomaly threshold alerting.'
              : 'Alerts you mark as resolved will appear here.'}
          </p>
          {filter === 'ACTIVE' && (
            <button
              onClick={() => onRouteChange('playground')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Test in Policy Gateway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-colors ${
                alert.status === 'ACTIVE'
                  ? alert.severity === 'CRITICAL'
                    ? 'border-rose-800/60 bg-rose-950/20'
                    : 'border-amber-800/60 bg-amber-950/20'
                  : 'bg-slate-900/40 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                      {alert.id}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        alert.status === 'ACTIVE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      }`}
                    >
                      {alert.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Detected: {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{alert.title}</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      (Sliding Window: {alert.windowSeconds / 60}m)
                    </span>
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Target Agent:</span>
                      <strong className="text-white font-mono">{alert.agentId}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Denied Operations:</span>
                      <strong className="text-rose-400 font-mono">{alert.attemptCount}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 font-mono">Latest Reason: </span>
                    <span className="text-slate-300">{alert.latestReason}</span>
                  </div>
                </div>

                {alert.status === 'ACTIVE' && (
                  <div className="shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      disabled={isLoading}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
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

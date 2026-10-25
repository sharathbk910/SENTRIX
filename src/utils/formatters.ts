/**
 * Pure formatting and display utility functions for the SENTRIX UI.
 */

import { RiskLevel, PolicyDecision } from '../types';

/**
 * Formats an ISO date string into a clean local time representation (HH:MM:SS)
 */
export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO date string into a readable date + time string
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoString;
  }
}

/**
 * Truncates cryptographic SHA-256 hashes for clean presentation
 */
export function truncateHash(hash: string, headChars = 8, tailChars = 6): string {
  if (!hash) return '';
  if (hash.length <= headChars + tailChars) return hash;
  return `${hash.slice(0, headChars)}...${hash.slice(-tailChars)}`;
}

/**
 * Returns Tailwind color classes corresponding to risk score / level
 */
export function getRiskColorClass(level: RiskLevel): { text: string; bg: string; border: string } {
  switch (level) {
    case 'CRITICAL':
      return { text: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-500/40' };
    case 'HIGH':
      return { text: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/40' };
    case 'MEDIUM':
      return { text: 'text-amber-300', bg: 'bg-amber-950/30', border: 'border-amber-500/40' };
    case 'LOW':
    default:
      return { text: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/40' };
  }
}

/**
 * Returns Tailwind color classes corresponding to policy decision verdicts
 */
export function getDecisionColorClass(decision: PolicyDecision): { text: string; bg: string; border: string } {
  switch (decision) {
    case 'ALLOW':
      return { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' };
    case 'BLOCK':
      return { text: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/30' };
    case 'REQUIRE_APPROVAL':
      return { text: 'text-amber-300', bg: 'bg-amber-950/40', border: 'border-amber-500/30' };
    default:
      return { text: 'text-[#9194A1]', bg: 'bg-[#121317]', border: 'border-[#1C1D22]' };
  }
}

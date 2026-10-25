/**
 * SENTRIX Security Gateway — Client Environment Configuration
 * Centralizes all frontend environment variables, constants, and runtime defaults.
 */

interface ClientConfig {
  /** Base URL for API calls (defaults to '/api' for same-origin proxy / serverless) */
  readonly apiUrl: string;
  /** Application display name */
  readonly appName: string;
  /** Polling interval for live security telemetry (milliseconds) */
  readonly pollingIntervalMs: number;
  /** Toast auto-dismiss timeout (milliseconds) */
  readonly toastDurationMs: number;
  /** Runtime mode detection */
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
}

const getEnvString = (key: string, fallback: string): string => {
  try {
    const val = (import.meta as any).env?.[key];
    if (typeof val === 'string' && val.trim() !== '') {
      return val.trim();
    }
  } catch {
    // Ignore in non-vite contexts
  }
  return fallback;
};

export const config: ClientConfig = {
  apiUrl: getEnvString('VITE_API_URL', '/api').replace(/\/+$/, ''),
  appName: getEnvString('VITE_APP_NAME', 'SENTRIX'),
  pollingIntervalMs: 8000,
  toastDurationMs: 4500,
  isProduction: Boolean((import.meta as any).env?.PROD),
  isDevelopment: Boolean((import.meta as any).env?.DEV)
};

export default config;

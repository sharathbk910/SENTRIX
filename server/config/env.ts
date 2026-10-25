/**
 * SENTRIX Security Gateway — Server Environment Configuration
 * Centralizes all backend runtime variables, thresholds, and service parameters.
 */

interface ServerConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly anomalyThreshold: number;
  readonly anomalyWindowSeconds: number;
  readonly approvalTtlMinutes: number;
  readonly serviceName: string;
  readonly gatewayVersion: string;
}

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  anomalyThreshold: parseInt(process.env.SENTRIX_ANOMALY_THRESHOLD || '3', 10),
  anomalyWindowSeconds: parseInt(process.env.SENTRIX_ANOMALY_WINDOW_SECONDS || '300', 10),
  approvalTtlMinutes: parseInt(process.env.SENTRIX_APPROVAL_TTL_MINUTES || '10', 10),
  serviceName: 'SENTRIX AI Agent Security Gateway',
  gatewayVersion: '2.4.0'
};

export default serverConfig;

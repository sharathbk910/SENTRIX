import { BehaviorAnomalyAlert } from '../types';

interface AgentRecord {
  blockedTimestamps: number[];
  latestReason: string;
  lastAttemptAt: string;
}

export class BehaviorAnomalyDetector {
  private threshold = 3; // 3 blocked attempts
  private windowSeconds = 300; // 5 minutes (300 seconds)
  private agentRecords: Map<string, AgentRecord> = new Map();
  private alerts: BehaviorAnomalyAlert[] = [];

  constructor() {
    // Seed one resolved baseline historical alert for realism
    this.alerts.push({
      id: 'ALT-ANOMALY-001',
      agentId: 'agent-recon-bot-9',
      attemptCount: 4,
      windowSeconds: 300,
      latestReason: 'Repeated unauthorized access attempts against internal credential stores',
      severity: 'WARNING',
      status: 'RESOLVED',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      lastAttemptAt: new Date(Date.now() - 3600000 * 3 + 120000).toISOString(),
      title: 'Suspicious Activity: Excessive Denials',
      description: 'Agent accumulated 4 blocked operations within 5-minute sliding window.'
    });
  }

  /**
   * Records a blocked action attempt for an agent and evaluates threshold
   */
  public recordBlockedAttempt(agentId: string, reason: string): BehaviorAnomalyAlert | null {
    const id = agentId || 'agent-default-worker';
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;

    let record = this.agentRecords.get(id);
    if (!record) {
      record = {
        blockedTimestamps: [],
        latestReason: reason,
        lastAttemptAt: new Date(now).toISOString()
      };
      this.agentRecords.set(id, record);
    }

    // Prune timestamps older than window
    record.blockedTimestamps = record.blockedTimestamps.filter(t => now - t <= windowMs);
    record.blockedTimestamps.push(now);
    record.latestReason = reason;
    record.lastAttemptAt = new Date(now).toISOString();

    const count = record.blockedTimestamps.length;

    if (count >= this.threshold) {
      // Check if there is already an active alert for this agent
      const existingAlert = this.alerts.find(a => a.agentId === id && a.status === 'ACTIVE');
      if (existingAlert) {
        existingAlert.attemptCount = count;
        existingAlert.lastAttemptAt = record.lastAttemptAt;
        existingAlert.latestReason = reason;
        return existingAlert;
      }

      // Generate new alert
      const newAlert: BehaviorAnomalyAlert = {
        id: `ALT-ANOMALY-${Date.now().toString(36).toUpperCase()}`,
        agentId: id,
        attemptCount: count,
        windowSeconds: this.windowSeconds,
        latestReason: reason,
        severity: count >= 5 ? 'CRITICAL' : 'WARNING',
        status: 'ACTIVE',
        createdAt: new Date(now).toISOString(),
        lastAttemptAt: record.lastAttemptAt,
        title: 'Behavior Anomaly Detected',
        description: `Agent '${id}' exceeded safe threshold with ${count} blocked attempts within ${this.windowSeconds / 60} minutes.`
      };

      this.alerts.unshift(newAlert);
      return newAlert;
    }

    return null;
  }

  public getAlerts(): BehaviorAnomalyAlert[] {
    return [...this.alerts];
  }

  public getActiveAlertsCount(): number {
    return this.alerts.filter(a => a.status === 'ACTIVE').length;
  }

  public resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
      return true;
    }
    return false;
  }

  public reset(): void {
    this.agentRecords.clear();
    this.alerts = this.alerts.filter(a => a.id === 'ALT-ANOMALY-001');
  }
}

export const anomalyDetector = new BehaviorAnomalyDetector();

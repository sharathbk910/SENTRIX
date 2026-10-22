import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const apiRouter = Router();

/**
 * POST /api/actions/evaluate
 * Evaluates proposed agent action through the 10-step security gateway pipeline.
 */
apiRouter.post('/actions/evaluate', (req: Request, res: Response) => {
  try {
    const {
      tool,
      operation,
      resource,
      description,
      parameters,
      agent_id,
      untrusted_document,
      leak_policy
    } = req.body || {};

    if (!tool || !operation || !resource) {
      res.status(400).json({
        success: false,
        decision: 'BLOCK',
        reason: 'Validation failure: tool, operation, and resource fields are required.',
        actionId: 'ERR-' + Date.now().toString(36),
        executionStatus: 'BLOCKED'
      });
      return;
    }

    const result = securityGatewayService.evaluateAction({
      tool,
      operation,
      resource,
      description,
      parameters,
      agent_id,
      untrusted_document,
      leak_policy
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      decision: 'BLOCK',
      reason: 'Server error during policy evaluation: ' + (error?.message || 'Unknown'),
      actionId: 'ERR-500',
      executionStatus: 'FAILED'
    });
  }
});

/**
 * GET /api/policies
 * Returns active security policies.
 */
apiRouter.get('/policies', (_req: Request, res: Response) => {
  try {
    const policies = securityGatewayService.getPolicies();
    res.json({ success: true, policies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/policy-conflicts
 * Feature D: Returns detected contradictory policy rules.
 */
apiRouter.get('/policy-conflicts', (_req: Request, res: Response) => {
  try {
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, conflicts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/policies/:id/toggle
 * Toggles a policy enabled state.
 */
apiRouter.patch('/policies/:id/toggle', (req: Request, res: Response) => {
  try {
    const updated = securityGatewayService.togglePolicy(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Policy not found' });
      return;
    }
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, policy: updated, conflicts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/approvals
 * Returns pending approval requests with real-time expiry evaluation.
 */
apiRouter.get('/approvals', (_req: Request, res: Response) => {
  try {
    const approvals = securityGatewayService.getApprovals();
    res.json({ success: true, approvals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/approvals/:id/decision
 * Approves or rejects a pending action with server-side expiry and replay protection.
 */
apiRouter.post('/approvals/:id/decision', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, reviewer } = req.body || {};

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      res.status(400).json({
        success: false,
        message: 'Invalid decision: Must be either APPROVE or REJECT'
      });
      return;
    }

    const result = securityGatewayService.processApprovalDecision(id, decision, reviewer);
    const statusCode = result.success ? 200 : (result.message.includes('not found') ? 404 : 409);
    
    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/approvals/:id/simulate-expiry (Feature E Demo Helper)
 * Explicitly expires an approval for quick live demonstration without waiting.
 */
apiRouter.post('/approvals/:id/simulate-expiry', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvals = securityGatewayService.getApprovals();
    const target = approvals.find(a => a.id === id);
    if (!target) {
      res.status(404).json({ success: false, message: 'Approval not found' });
      return;
    }
    // Set expiry in the past
    target.expires_at = new Date(Date.now() - 60000).toISOString();
    target.status = 'EXPIRED';
    res.json({ success: true, message: `Approval ${id} validity has expired.`, approval: target });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts (Feature C)
 * Returns behavior anomaly alerts.
 */
apiRouter.get('/alerts', (_req: Request, res: Response) => {
  try {
    const alerts = securityGatewayService.getAlerts();
    res.json({ success: true, alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/:id/resolve (Feature C)
 * Resolves an anomaly alert.
 */
apiRouter.post('/alerts/:id/resolve', (req: Request, res: Response) => {
  try {
    const success = securityGatewayService.resolveAlert(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }
    res.json({ success: true, message: 'Alert marked as RESOLVED' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/emergency-pause (Feature F)
 * Returns Emergency Pause state.
 */
apiRouter.get('/emergency-pause', (_req: Request, res: Response) => {
  try {
    const pauseState = securityGatewayService.getEmergencyPauseState();
    res.json({
      success: true,
      pauseState,
      isPaused: pauseState.isPaused,
      paused: pauseState.isPaused
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/emergency-pause/toggle (Feature F)
 * Activates or deactivates server-enforced emergency agent pause.
 */
apiRouter.post('/emergency-pause/toggle', (req: Request, res: Response) => {
  try {
    const { pause, operator, reason } = req.body || {};
    const updated = securityGatewayService.setEmergencyPause(
      !!pause,
      operator || 'SecOps Admin',
      reason || (pause ? 'Emergency halt ordered by administrator' : 'Resumed by administrator')
    );
    res.json({ success: true, pauseState: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/audit
 * Returns truthful audit log events.
 */
apiRouter.get('/audit', (_req: Request, res: Response) => {
  try {
    const auditEvents = securityGatewayService.getAuditEvents();
    res.json({ success: true, events: auditEvents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 * Returns computed metrics from actual recorded events.
 */
apiRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = securityGatewayService.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/resources
 * Returns mock protected resources state for security verification.
 */
apiRouter.get('/resources', (_req: Request, res: Response) => {
  try {
    const resources = securityGatewayService.getMockResources();
    res.json({ success: true, resources });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reset
 * Resets the demo state.
 */
apiRouter.post('/reset', (_req: Request, res: Response) => {
  try {
    securityGatewayService.resetDemo();
    res.json({ success: true, message: 'Demo environment reset to baseline state.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

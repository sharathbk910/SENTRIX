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
 * POST /api/policies/translate
 * Feature 3: Converts Plain-English statements into structured policies with validation and test cases.
 */
apiRouter.post('/policies/translate', (req: Request, res: Response) => {
  try {
    const { input } = req.body || {};
    if (!input || typeof input !== 'string') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'The "input" field containing the plain-English policy rule is required.'
      });
      return;
    }

    const result = securityGatewayService.translatePolicy(input);
    res.status(result.success ? 200 : 422).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/policies
 * Feature 3: Creates and activates a validated security policy.
 */
apiRouter.post('/policies', (req: Request, res: Response) => {
  try {
    const { name, tool, operation, resource_pattern, decision, reason, risk_score, conditions, natural_language_source } = req.body || {};

    if (!name || !tool || !operation || !resource_pattern || !decision) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Fields name, tool, operation, resource_pattern, and decision are required.'
      });
      return;
    }

    if (decision !== 'ALLOW' && decision !== 'BLOCK' && decision !== 'REQUIRE_APPROVAL') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Decision must be ALLOW, BLOCK, or REQUIRE_APPROVAL.'
      });
      return;
    }

    const created = securityGatewayService.addPolicy({
      name,
      tool,
      operation,
      resource_pattern,
      decision,
      reason: reason || `Policy ${name} enforced with ${decision}`,
      risk_score: typeof risk_score === 'number' ? risk_score : (decision === 'BLOCK' ? 90 : decision === 'REQUIRE_APPROVAL' ? 70 : 15),
      conditions,
      natural_language_source,
      enabled: true,
      status: 'ACTIVE'
    });

    const conflicts = securityGatewayService.getPolicyConflicts();
    res.status(201).json({ success: true, policy: created.policy, conflicts, conflict: created.conflict });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/policies/:id
 * Feature 3: Deletes a security policy.
 */
apiRouter.delete('/policies/:id', (req: Request, res: Response) => {
  try {
    const success = securityGatewayService.deletePolicy(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Policy not found' });
      return;
    }
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, message: `Policy ${req.params.id} revoked`, conflicts });
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
 * Feature 4: Approves or rejects a pending action with server-side expiry, replay defense, and reason tracking.
 */
apiRouter.post('/approvals/:id/decision', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, reviewer, rejectionReason } = req.body || {};

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      res.status(400).json({
        success: false,
        message: 'Invalid decision: Must be either APPROVE or REJECT'
      });
      return;
    }

    const result = securityGatewayService.processApprovalDecision(id, decision, reviewer, rejectionReason);
    const statusCode = result.success ? 200 : (result.message.includes('not found') ? 404 : 409);

    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/approvals/:id/simulate-expiry
 * Helper to test auto-expiry enforcement without waiting.
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
    target.expires_at = new Date(Date.now() - 60000).toISOString();
    target.status = 'EXPIRED';
    res.json({ success: true, message: `Approval ${id} validity has expired.`, approval: target });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts
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
 * POST /api/alerts/:id/resolve
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
 * GET /api/emergency-pause
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
 * POST /api/emergency-pause/toggle
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
 * Returns audit log events linked with cryptographic hashes.
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
 * GET & POST /api/audit/verify
 * Feature 5: Verifies SHA-256 cryptographic hash chain integrity from Genesis to Head.
 */
const verifyHandler = (_req: Request, res: Response) => {
  try {
    const verification = securityGatewayService.verifyAuditIntegrity();
    res.json({ success: true, verification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
apiRouter.get('/audit/verify', verifyHandler);
apiRouter.post('/audit/verify', verifyHandler);

/**
 * POST /api/audit/simulate-tamper
 * Feature 5: Deliberately alters an audit event without updating its hash seal to prove tamper detection in live demos.
 */
apiRouter.post('/audit/simulate-tamper', (req: Request, res: Response) => {
  try {
    const { eventId } = req.body || {};
    const result = securityGatewayService.simulateAuditTamper(eventId);
    if (!result) {
      res.status(404).json({ success: false, message: 'Target event not found or audit log empty' });
      return;
    }
    res.json({
      success: true,
      message: `Event ${result.eventId} was mutated without recomputing its cryptographic seal. Integrity verification will now report tampering.`,
      result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/attack-demo/scenario
 * Feature 1: Returns predefined live attack demonstration scenario details.
 */
apiRouter.get('/attack-demo/scenario', (_req: Request, res: Response) => {
  try {
    const scenario = securityGatewayService.getAttackScenario();
    res.json({ success: true, scenario });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/attack-demo/run
 * Feature 1: Runs the live attack demonstration comparative execution.
 */
apiRouter.post('/attack-demo/run', (_req: Request, res: Response) => {
  try {
    const execution = securityGatewayService.runAttackDemo();
    res.json({ success: true, execution });
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
 * Resets the demo state to clean baseline.
 */
apiRouter.post('/reset', (_req: Request, res: Response) => {
  try {
    securityGatewayService.resetDemo();
    res.json({ success: true, message: 'Demo environment reset to baseline state.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

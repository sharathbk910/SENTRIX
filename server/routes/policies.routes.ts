import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const policiesRouter = Router();

/**
 * GET /api/policies
 * Returns active security policies.
 */
policiesRouter.get('/', (_req: Request, res: Response) => {
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
policiesRouter.post('/translate', (req: Request, res: Response) => {
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
policiesRouter.post('/', (req: Request, res: Response) => {
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
policiesRouter.delete('/:id', (req: Request, res: Response) => {
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
 * PATCH /api/policies/:id/toggle
 * Toggles a policy enabled state.
 */
policiesRouter.patch('/:id/toggle', (req: Request, res: Response) => {
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

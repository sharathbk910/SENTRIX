import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const actionsRouter = Router();

/**
 * POST /api/actions/evaluate
 * Evaluates proposed agent action through the 10-step security gateway pipeline.
 */
actionsRouter.post('/evaluate', (req: Request, res: Response) => {
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

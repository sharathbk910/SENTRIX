import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const approvalsRouter = Router();

/**
 * GET /api/approvals
 * Returns pending approval requests with real-time expiry evaluation.
 */
approvalsRouter.get('/', (_req: Request, res: Response) => {
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
approvalsRouter.post('/:id/decision', (req: Request, res: Response) => {
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
approvalsRouter.post('/:id/simulate-expiry', (req: Request, res: Response) => {
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

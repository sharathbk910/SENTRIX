import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const auditRouter = Router();

/**
 * GET /api/audit
 * Returns audit log events linked with cryptographic hashes.
 */
auditRouter.get('/', (_req: Request, res: Response) => {
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
auditRouter.get('/verify', verifyHandler);
auditRouter.post('/verify', verifyHandler);

/**
 * POST /api/audit/simulate-tamper
 * Feature 5: Deliberately alters an audit event without updating its hash seal to prove tamper detection in live demos.
 */
auditRouter.post('/simulate-tamper', (req: Request, res: Response) => {
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

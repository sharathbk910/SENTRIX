import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const systemRouter = Router();

/**
 * GET /api/alerts
 * Returns behavior anomaly alerts.
 */
systemRouter.get('/alerts', (_req: Request, res: Response) => {
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
systemRouter.post('/alerts/:id/resolve', (req: Request, res: Response) => {
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
systemRouter.get('/emergency-pause', (_req: Request, res: Response) => {
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
systemRouter.post('/emergency-pause/toggle', (req: Request, res: Response) => {
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
 * GET /api/policy-conflicts
 * Feature D: Returns detected contradictory policy rules.
 */
systemRouter.get('/policy-conflicts', (_req: Request, res: Response) => {
  try {
    const conflicts = securityGatewayService.getPolicyConflicts();
    res.json({ success: true, conflicts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 * Returns computed metrics from actual recorded events.
 */
systemRouter.get('/stats', (_req: Request, res: Response) => {
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
systemRouter.get('/resources', (_req: Request, res: Response) => {
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
systemRouter.post('/reset', (_req: Request, res: Response) => {
  try {
    securityGatewayService.resetDemo();
    res.json({ success: true, message: 'Demo environment reset to baseline state.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

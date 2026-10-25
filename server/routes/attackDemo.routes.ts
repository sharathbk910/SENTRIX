import { Router, Request, Response } from 'express';
import { securityGatewayService } from '../services/securityGateway';

export const attackDemoRouter = Router();

/**
 * GET /api/attack-demo/scenario
 * Feature 1: Returns predefined live attack demonstration scenario details.
 */
attackDemoRouter.get('/scenario', (_req: Request, res: Response) => {
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
attackDemoRouter.post('/run', (_req: Request, res: Response) => {
  try {
    const execution = securityGatewayService.runAttackDemo();
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

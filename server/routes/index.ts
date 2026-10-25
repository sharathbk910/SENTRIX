import { Router } from 'express';
import { actionsRouter } from './actions.routes';
import { policiesRouter } from './policies.routes';
import { approvalsRouter } from './approvals.routes';
import { auditRouter } from './audit.routes';
import { attackDemoRouter } from './attackDemo.routes';
import { systemRouter } from './system.routes';

export const apiRouter = Router();

// Modular Sub-Routers
apiRouter.use('/actions', actionsRouter);
apiRouter.use('/policies', policiesRouter);
apiRouter.use('/approvals', approvalsRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/attack-demo', attackDemoRouter);

// System & Global Controllers
apiRouter.use('/', systemRouter);

export default apiRouter;

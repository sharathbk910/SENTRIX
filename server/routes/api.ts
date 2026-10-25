/**
 * SENTRIX AI Agent Security Gateway — API Router Entry Point
 * Re-exports the unified, modular API router.
 */

export { apiRouter, default } from './index';
export { actionsRouter } from './actions.routes';
export { policiesRouter } from './policies.routes';
export { approvalsRouter } from './approvals.routes';
export { auditRouter } from './audit.routes';
export { attackDemoRouter } from './attackDemo.routes';
export { systemRouter } from './system.routes';

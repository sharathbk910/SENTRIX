import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';

const app = express();

// Permissive CORS to allow frontend calls across origins and Vercel domains
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check endpoints
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'SENTRIX AI Agent Security Gateway',
    version: '2.4.0',
    engine: 'Deterministic Deny-By-Default Policy Engine',
    timestamp: new Date().toISOString()
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount API router under both /api and root to eliminate Vercel rewrite prefix mismatches
app.use('/api', apiRouter);
app.use(apiRouter);

// Deterministic 404 handler returning structured JSON (never plain HTML)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API endpoint ${req.method} ${req.originalUrl || req.url} was not found on SENTRIX gateway.`
  });
});

// Global structured error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SENTRIX Gateway Internal Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An internal error occurred on the security gateway.'
  });
});

export { app };
export default app;

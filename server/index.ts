import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Security gateway API router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'SENTRIX AI Agent Security Gateway',
    version: '1.0.0-hackathon',
    engine: 'Deterministic Deny-By-Default Policy Engine'
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  SENTRIX AI AGENT SECURITY GATEWAY (PORT ${PORT})`);
  console.log(`   Status: ENFORCING POLICY BASELINE`);
  console.log(`   API Endpoint: http://localhost:${PORT}/api`);
  console.log(`   Engine Mode: DETERMINISTIC LOCAL ISOLATION`);
  console.log(`======================================================\n`);
});

export default app;

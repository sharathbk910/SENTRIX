import { app } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Only listen if executed directly, avoiding port conflicts in serverless environments
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  SENTRIX AI AGENT SECURITY GATEWAY (PORT ${PORT})`);
    console.log(`   Status: ENFORCING POLICY BASELINE`);
    console.log(`   API Endpoint: http://localhost:${PORT}/api`);
    console.log(`   Engine Mode: DETERMINISTIC ZERO-TRUST GATEWAY`);
    console.log(`======================================================\n`);
  });
}

export { app };
export default app;

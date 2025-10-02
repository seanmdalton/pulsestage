import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { initRedis } from "./middleware/rateLimit.js";
import { createApp } from "./app.js";

const prisma = new PrismaClient();

// Initialize Redis and start server
async function start() {
  await initRedis();
  
  const app = createApp(prisma);
  
  app.listen(env.PORT, async () => {
    // Ensure schema is present when running outside CI/container
    try { await prisma.$executeRawUnsafe('SELECT 1'); } catch {}
    console.log(`ama-api listening on :${env.PORT}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`Admin key: ${env.ADMIN_KEY ? 'configured' : 'not configured'}`);
  });
}

start().catch(console.error);


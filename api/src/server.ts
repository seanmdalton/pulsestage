/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { initRedis } from "./middleware/rateLimit.js";
import { initSessionStore } from "./middleware/session.js";
import { createApp } from "./app.js";

const prisma = new PrismaClient();

// Initialize Redis and start server
async function start() {
  // Initialize Redis for rate limiting (non-blocking)
  try {
    await initRedis();
  } catch (error) {
    console.warn('Redis initialization failed, continuing without rate limiting:', error);
  }

  // Initialize Redis for sessions (non-blocking)
  try {
    await initSessionStore();
  } catch (error) {
    console.warn('Session store initialization failed, using memory store:', error);
  }
  
  const app = createApp(prisma);
  
  app.listen(env.PORT, async () => {
    // Ensure schema is present when running outside CI/container
    try { 
      await prisma.$executeRawUnsafe('SELECT 1'); 
      console.log('Database connection verified');
    } catch (error) {
      console.warn('Database connection check failed:', error);
    }
    console.log(`ama-api listening on :${env.PORT}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`Admin key: ${env.ADMIN_KEY ? 'configured' : 'not configured'}`);
  });
}

start().catch(console.error);


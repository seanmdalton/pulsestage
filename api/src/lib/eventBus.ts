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

import { Response } from 'express';
import { env } from '../env.js';

/**
 * SSE Event types
 */
export type SSEEventType = 
  | 'question:created'
  | 'question:upvoted'
  | 'question:answered'
  | 'question:tagged'
  | 'question:untagged'
  | 'heartbeat';

export interface SSEEvent {
  type: SSEEventType;
  tenantId: string;
  data: any;
  timestamp: number;
}

export interface SSEClient {
  id: string;
  tenantId: string;
  res: Response;
  connectedAt: number;
}

/**
 * Event Bus for Server-Sent Events
 * Manages connections per tenant and publishes events
 */
class EventBus {
  private clients: Map<string, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionCounter = 0;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Add a client connection for a specific tenant
   */
  addClient(tenantId: string, res: Response): string {
    const clientId = `client-${++this.connectionCounter}-${Date.now()}`;
    const client: SSEClient = {
      id: clientId,
      tenantId,
      res,
      connectedAt: Date.now()
    };

    if (!this.clients.has(tenantId)) {
      this.clients.set(tenantId, []);
    }

    this.clients.get(tenantId)!.push(client);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 SSE: Client ${clientId} connected to tenant ${tenantId} (total: ${this.getClientCount(tenantId)})`);
    }

    return clientId;
  }

  /**
   * Remove a client connection
   */
  removeClient(tenantId: string, clientId: string) {
    const tenantClients = this.clients.get(tenantId);
    if (!tenantClients) return;

    const index = tenantClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      tenantClients.splice(index, 1);
      
      if (tenantClients.length === 0) {
        this.clients.delete(tenantId);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 SSE: Client ${clientId} disconnected from tenant ${tenantId} (remaining: ${this.getClientCount(tenantId)})`);
      }
    }
  }

  /**
   * Publish an event to all clients in a specific tenant
   */
  publish(event: SSEEvent) {
    const tenantClients = this.clients.get(event.tenantId);
    if (!tenantClients || tenantClients.length === 0) {
      return; // No clients to send to
    }

    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    const deadClients: string[] = [];

    for (const client of tenantClients) {
      try {
        client.res.write(eventData);
      } catch (error) {
        // Connection is dead, mark for removal
        deadClients.push(client.id);
      }
    }

    // Clean up dead connections
    for (const clientId of deadClients) {
      this.removeClient(event.tenantId, clientId);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 SSE: Published ${event.type} to ${tenantClients.length} clients in tenant ${event.tenantId}`);
    }
  }

  /**
   * Send heartbeat to all connected clients
   */
  private sendHeartbeat() {
    const now = Date.now();

    for (const [tenantId, tenantClients] of this.clients.entries()) {
      const heartbeatEvent: SSEEvent = {
        type: 'heartbeat',
        tenantId,
        data: { timestamp: now },
        timestamp: now
      };

      this.publish(heartbeatEvent);
    }
  }

  /**
   * Start periodic heartbeat
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, env.SSE_HEARTBEAT_INTERVAL);

    if (process.env.NODE_ENV === 'development') {
      console.log(`💓 SSE: Heartbeat started (interval: ${env.SSE_HEARTBEAT_INTERVAL}ms)`);
    }
  }

  /**
   * Stop heartbeat (for cleanup)
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get client count for a tenant
   */
  getClientCount(tenantId: string): number {
    return this.clients.get(tenantId)?.length || 0;
  }

  /**
   * Get total client count across all tenants
   */
  getTotalClientCount(): number {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.length;
    }
    return total;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const tenantMetrics: Record<string, number> = {};
    for (const [tenantId, clients] of this.clients.entries()) {
      tenantMetrics[tenantId] = clients.length;
    }

    return {
      totalConnections: this.getTotalClientCount(),
      tenantConnections: tenantMetrics,
      tenantCount: this.clients.size
    };
  }
}

// Singleton instance
export const eventBus = new EventBus();


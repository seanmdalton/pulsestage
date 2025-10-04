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

import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type SSEEvent = {
  type: string;
  tenantId?: string;
  tenantSlug?: string;
  data?: any;
  timestamp: number;
};

export type SSEOptions = {
  onEvent?: (event: SSEEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
};

/**
 * Hook to connect to SSE endpoint for real-time updates
 * Automatically handles reconnection and cleanup
 */
export function useSSE(options: SSEOptions = {}) {
  const {
    onEvent,
    onConnected,
    onDisconnected,
    onError,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldConnectRef = useRef(true);

  useEffect(() => {
    shouldConnectRef.current = true;

    const connect = () => {
      if (!shouldConnectRef.current) return;

      // Get tenant from localStorage (set by SSO test page)
      const mockTenant = localStorage.getItem('mock-tenant') || 'default';
      
      // Construct SSE URL with tenant as query parameter
      // EventSource doesn't support custom headers, so we use query params
      const url = `${API_URL}/events?tenant=${encodeURIComponent(mockTenant)}`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        onConnected?.();
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('📡 SSE: Connected to event stream');
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);
          
          // Handle heartbeat separately
          if (sseEvent.type === 'heartbeat') {
            setLastHeartbeat(sseEvent.timestamp || Date.now());
            return;
          }

          // Handle other events
          onEvent?.(sseEvent);

          if (process.env.NODE_ENV === 'development') {
            console.log('📡 SSE: Received event:', sseEvent.type);
          }
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        onError?.(error);
        
        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Schedule reconnect if still mounted
        if (shouldConnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('📡 SSE: Attempting to reconnect...');
            }
            connect();
          }, reconnectInterval);
        }
      };
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      shouldConnectRef.current = false;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setIsConnected(false);
      onDisconnected?.();
    };
  }, []); // Empty deps - only connect once per mount

  return {
    isConnected,
    lastHeartbeat
  };
}


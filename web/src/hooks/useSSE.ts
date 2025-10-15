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

import { useEffect, useRef, useState } from 'react'
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export type SSEEvent = {
  type: string
  tenantId?: string
  tenantSlug?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  timestamp: number
}

export type SSEOptions = {
  onEvent?: (event: SSEEvent) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
}

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
    reconnectInterval = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldConnectRef = useRef(true)

  useEffect(() => {
    shouldConnectRef.current = true

    const connect = async () => {
      if (!shouldConnectRef.current) return

      // Get tenant from localStorage (set by SSO test page)
      const mockTenant = localStorage.getItem('mock-tenant') || 'default'

      // Construct SSE URL with tenant as query parameter
      const url = `${API_URL}/events?tenant=${encodeURIComponent(mockTenant)}`

      // Create abort controller for this connection
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        await fetchEventSource(url, {
          signal: abortController.signal,
          credentials: 'include', // Send cookies with request (critical for authentication!)
          headers: {
            Accept: 'text/event-stream',
          },
          async onopen(response) {
            if (
              response.ok &&
              response.headers.get('content-type') === EventStreamContentType
            ) {
              setIsConnected(true)
              onConnected?.()

              if (process.env.NODE_ENV === 'development') {
                console.log('📡 SSE: Connected to event stream')
              }

              // Clear any pending reconnect
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
              }

              return // Continue processing
            } else if (
              response.status >= 400 &&
              response.status < 500 &&
              response.status !== 429
            ) {
              // Client error (like 401 Unauthorized), don't retry
              console.error(
                'SSE connection failed:',
                response.status,
                response.statusText
              )
              const error = new Error(
                `HTTP ${response.status}: ${response.statusText}`
              )
              onError?.(error as unknown as Event)
              throw error // Stop retrying
            } else {
              // Server error or rate limit, will retry
              console.warn('SSE connection error, will retry:', response.status)
              throw new Error(`HTTP ${response.status}`)
            }
          },
          onmessage(event) {
            try {
              const sseEvent: SSEEvent = JSON.parse(event.data)

              // Handle heartbeat separately
              if (sseEvent.type === 'heartbeat') {
                setLastHeartbeat(sseEvent.timestamp || Date.now())
                return
              }

              // Handle other events
              onEvent?.(sseEvent)

              if (process.env.NODE_ENV === 'development') {
                console.log('📡 SSE: Received event:', sseEvent.type)
              }
            } catch (error) {
              console.error('Failed to parse SSE event:', error)
            }
          },
          onerror(error) {
            console.error('SSE connection error:', error)
            setIsConnected(false)
            onError?.(error as unknown as Event)

            // The library will automatically retry for server errors
            // We can return a delay in ms, or throw to stop retrying
            if (shouldConnectRef.current && !abortController.signal.aborted) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`📡 SSE: Reconnecting in ${reconnectInterval}ms...`)
              }
              return reconnectInterval // Return retry interval
            }
            throw error // Stop retrying if we're unmounting
          },
          openWhenHidden: true, // Keep connection alive when tab is hidden
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Expected when unmounting, don't log
          return
        }
        console.error('SSE fetch error:', error)

        // If we caught an error (like 401), the connection is closed
        setIsConnected(false)
        onDisconnected?.()

        // Don't retry automatically - let user re-authenticate if needed
      }
    }

    // Initial connection
    connect()

    // Cleanup on unmount
    return () => {
      shouldConnectRef.current = false

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      setIsConnected(false)
      onDisconnected?.()
    }
  }, []) // Empty deps - only connect once per mount

  return {
    isConnected,
    lastHeartbeat,
  }
}

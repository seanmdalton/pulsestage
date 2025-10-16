import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthSelector } from './AuthSelector'

// Mock fetch
global.fetch = vi.fn()

describe.skip('AuthSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    ;(global.fetch as any).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    render(<AuthSelector />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display demo mode when available', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        modes: ['demo'],
        demo: {
          enabled: true,
          users: ['demo@test.com', 'admin@test.com'],
        },
        oauth: {
          github: false,
          google: false,
        },
      }),
    })

    render(<AuthSelector />)

    await waitFor(
      () => {
        expect(screen.getByText(/demo mode/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should display OAuth options when available', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        modes: ['oauth'],
        demo: {
          enabled: false,
        },
        oauth: {
          github: true,
          google: true,
        },
      }),
    })

    render(<AuthSelector />)

    await waitFor(() => {
      expect(screen.getByText(/github/i)).toBeInTheDocument()
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })
  })

  it('should show error message on fetch failure', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(
      new Error('Failed to fetch authentication modes')
    )

    render(<AuthSelector />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('should handle empty auth modes gracefully', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        modes: [],
        demo: {
          enabled: false,
        },
        oauth: {
          github: false,
          google: false,
        },
      }),
    })

    render(<AuthSelector />)

    await waitFor(() => {
      expect(
        screen.queryByText(/loading authentication/i)
      ).not.toBeInTheDocument()
    })
  })

  it('should call fetch with correct URL and credentials', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        modes: ['demo'],
        demo: { enabled: true, users: [] },
        oauth: { github: false, google: false },
      }),
    })

    render(<AuthSelector />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/modes'),
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })
})

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  afterAll,
} from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })

    // Should still be initial value before delay
    expect(result.current).toBe('initial')

    // Fast forward time and run timers
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Should now be updated value
    expect(result.current).toBe('updated')
  })

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    )

    rerender({ value: 'second', delay: 500 })
    rerender({ value: 'third', delay: 500 })

    // Should still be 'first' because timers were reset
    expect(result.current).toBe('first')

    // Run all timers
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Should now be 'third' (last value)
    expect(result.current).toBe('third')
  })

  it('should work with numbers', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 500 },
      }
    )

    expect(result.current).toBe(0)

    rerender({ value: 42, delay: 500 })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current).toBe(42)
  })

  it('should work with objects', async () => {
    const obj1 = { name: 'test' }
    const obj2 = { name: 'updated' }

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: obj1, delay: 500 },
      }
    )

    expect(result.current).toBe(obj1)

    rerender({ value: obj2, delay: 500 })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current).toBe(obj2)
  })
})

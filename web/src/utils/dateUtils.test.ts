import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWeekStart, getWeekLabel, groupQuestionsByWeek } from './dateUtils'
import type { Question } from '../lib/api'

describe('dateUtils', () => {
  describe('getWeekStart', () => {
    it('should return Sunday as week start', () => {
      const date = new Date('2025-10-16T12:00:00Z') // Thursday
      const weekStart = getWeekStart(date)
      expect(weekStart.getDay()).toBe(0) // Sunday
    })

    it('should reset time to start of day', () => {
      const date = new Date('2025-10-16T15:30:45Z')
      const weekStart = getWeekStart(date)
      expect(weekStart.getHours()).toBe(0)
      expect(weekStart.getMinutes()).toBe(0)
      expect(weekStart.getSeconds()).toBe(0)
      expect(weekStart.getMilliseconds()).toBe(0)
    })

    it('should handle Sunday dates correctly', () => {
      const sunday = new Date('2025-10-12T12:00:00Z') // Sunday
      const weekStart = getWeekStart(sunday)
      expect(weekStart.getDay()).toBe(0)
      expect(weekStart.getDate()).toBe(12)
    })
  })

  describe('getWeekLabel', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-10-16T12:00:00Z')) // Thursday
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "This Week" for current week', () => {
      const date = new Date('2025-10-16T12:00:00Z')
      const label = getWeekLabel(date)
      expect(label).toBe('This Week')
    })

    it('should return "Last Week" for previous week', () => {
      const date = new Date('2025-10-09T12:00:00Z')
      const label = getWeekLabel(date)
      expect(label).toBe('Last Week')
    })

    it('should return month range for older weeks this year', () => {
      const date = new Date('2025-09-15T12:00:00Z')
      const label = getWeekLabel(date)
      expect(label).toMatch(/^[A-Z][a-z]{2} \d{1,2}/) // e.g., "Sep 14-20"
    })

    it('should include year for dates from different year', () => {
      const date = new Date('2024-12-25T12:00:00Z')
      const label = getWeekLabel(date)
      expect(label).toMatch(/2024/)
    })
  })

  describe('groupQuestionsByWeek', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-10-16T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should group questions by week', () => {
      const questions: Question[] = [
        {
          id: '1',
          body: 'Q1',
          upvotes: 5,
          status: 'ANSWERED',
          createdAt: '2025-10-16T10:00:00Z',
          respondedAt: '2025-10-16T12:00:00Z',
          updatedAt: '2025-10-16T12:00:00Z',
        } as Question,
        {
          id: '2',
          body: 'Q2',
          upvotes: 3,
          status: 'ANSWERED',
          createdAt: '2025-10-09T10:00:00Z',
          respondedAt: '2025-10-09T12:00:00Z',
          updatedAt: '2025-10-09T12:00:00Z',
        } as Question,
      ]

      const grouped = groupQuestionsByWeek(questions)
      expect(grouped).toHaveLength(2)
      expect(grouped[0].weekLabel).toBe('This Week')
      expect(grouped[1].weekLabel).toBe('Last Week')
    })

    it('should sort questions by upvotes within each week', () => {
      const questions: Question[] = [
        {
          id: '1',
          body: 'Q1',
          upvotes: 3,
          status: 'ANSWERED',
          createdAt: '2025-10-16T10:00:00Z',
          respondedAt: '2025-10-16T12:00:00Z',
          updatedAt: '2025-10-16T12:00:00Z',
        } as Question,
        {
          id: '2',
          body: 'Q2',
          upvotes: 5,
          status: 'ANSWERED',
          createdAt: '2025-10-16T11:00:00Z',
          respondedAt: '2025-10-16T13:00:00Z',
          updatedAt: '2025-10-16T13:00:00Z',
        } as Question,
      ]

      const grouped = groupQuestionsByWeek(questions)
      expect(grouped[0].questions[0].upvotes).toBe(5)
      expect(grouped[0].questions[1].upvotes).toBe(3)
    })

    it('should sort weeks newest first', () => {
      const questions: Question[] = [
        {
          id: '1',
          body: 'Q1',
          upvotes: 5,
          status: 'ANSWERED',
          createdAt: '2025-09-01T10:00:00Z',
          respondedAt: '2025-09-01T12:00:00Z',
          updatedAt: '2025-09-01T12:00:00Z',
        } as Question,
        {
          id: '2',
          body: 'Q2',
          upvotes: 3,
          status: 'ANSWERED',
          createdAt: '2025-10-16T10:00:00Z',
          respondedAt: '2025-10-16T12:00:00Z',
          updatedAt: '2025-10-16T12:00:00Z',
        } as Question,
      ]

      const grouped = groupQuestionsByWeek(questions)
      expect(grouped[0].weekLabel).toBe('This Week')
      expect(grouped[0].weekStart.getTime()).toBeGreaterThan(
        grouped[1].weekStart.getTime()
      )
    })

    it('should handle empty array', () => {
      const grouped = groupQuestionsByWeek([])
      expect(grouped).toHaveLength(0)
    })
  })
})

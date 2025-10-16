import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBaseTitle,
  setPageTitle,
  setFormattedPageTitle,
  PAGE_NAMES,
  TEAM_NAMES,
} from './titleUtils'

describe('titleUtils', () => {
  beforeEach(() => {
    document.title = ''
  })

  describe('getBaseTitle', () => {
    it('should return default title', () => {
      const title = getBaseTitle()
      expect(title).toBe('PulseStage')
    })
  })

  describe('setPageTitle', () => {
    it('should set page title with team and page', () => {
      setPageTitle('engineering', 'open questions')
      expect(document.title).toBe('Engineering - Open questions | PulseStage')
    })

    it('should set page title with only team', () => {
      setPageTitle('engineering')
      expect(document.title).toBe('Engineering | PulseStage')
    })

    it('should set page title with only page', () => {
      setPageTitle(undefined, 'admin panel')
      expect(document.title).toBe('Admin panel | PulseStage')
    })

    it('should set base title when no params', () => {
      setPageTitle()
      expect(document.title).toBe('PulseStage')
    })
  })

  describe('setFormattedPageTitle', () => {
    it('should format title with mapped page names', () => {
      setFormattedPageTitle('engineering', 'admin')
      expect(document.title).toBe('Engineering - Admin Panel | PulseStage')
    })

    it('should use custom team name from map', () => {
      setFormattedPageTitle('engineering', 'open')
      expect(document.title).toBe('Engineering - Open Questions | PulseStage')
    })

    it('should capitalize unknown slugs', () => {
      setFormattedPageTitle('custom', 'newpage')
      expect(document.title).toBe('Custom - Newpage | PulseStage')
    })
  })

  describe('PAGE_NAMES', () => {
    it('should have correct page name mappings', () => {
      expect(PAGE_NAMES['open']).toBe('Open Questions')
      expect(PAGE_NAMES['answered']).toBe('Answered Questions')
      expect(PAGE_NAMES['admin']).toBe('Admin Panel')
    })
  })

  describe('TEAM_NAMES', () => {
    it('should have correct team name mappings', () => {
      expect(TEAM_NAMES['all']).toBe('All Teams')
      expect(TEAM_NAMES['engineering']).toBe('Engineering')
      expect(TEAM_NAMES['product']).toBe('Product')
    })
  })
})

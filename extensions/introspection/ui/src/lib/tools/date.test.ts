import { describe, it, expect, vi, afterEach } from 'vitest'
import { date, formatISODuration } from './date'

describe('date', () => {
  afterEach(() => { vi.useRealTimers() })

  it('carries the year only outside the current one', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-05'))

    expect(date('2026-02-17', 'en-US')).toBe('Feb 17')
    expect(date('2024-02-17', 'en-US')).toBe('Feb 17, 2024')
  })
})

describe('formatISODuration', () => {
  it('formats ISO duration', () => {
    expect(formatISODuration('P1Y', 'en-US')).toBe('1 year')
    expect(formatISODuration('P1W', 'en-US')).toBe('1 week')
    expect(formatISODuration('P1M', 'ru-RU')).toBe('1 месяц')
  })
})

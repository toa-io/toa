import { it, expect } from 'vitest'
import { system } from './ui'

it('should read what the runtime ships as a system component', () => {
  expect(system({ namespace: 'cadence' })).toBe(true)
  expect(system({ namespace: 'continuity' })).toBe(true)
  expect(system({ namespace: 'dummies' })).toBe(false)
})

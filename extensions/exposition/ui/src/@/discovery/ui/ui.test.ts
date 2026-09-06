import { it, expect } from 'vitest'
import { CONSOLES, carries, published } from './ui'
import type { Discovered } from '@/discovery'

const tree: Discovered = {
  routes: {
    '/pots': { GET: {} },
    '/configuration/values': { GET: {} },
  },
}

it('should tell whether the tree carries a route', () => {
  expect(carries(tree, CONSOLES.configuration)).toBe(true)
  expect(carries(tree, CONSOLES.introspection)).toBe(false)
  expect(carries(null, CONSOLES.configuration)).toBe(false)
})

it('should tell whether anything is published to a model', () => {
  expect(published(tree)).toBe(false)
  expect(published({ routes: { '/pots': { GET: { mcp: true } } } })).toBe(true)
  expect(published(null)).toBe(false)
})

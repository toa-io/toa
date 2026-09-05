import { it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.js'
import type { Manifest } from '@toa.io/norm'

const component = {
  operations: {
    sweep: { type: 'effect' },
    gather: { type: 'transition' },
    peek: { type: 'observation' }
  }
} as unknown as Manifest

it('should normalize a declaration', () => {
  const declaration = manifest({ sweep: { cycle: 86400, intervals: 24 } }, component)

  assert.deepStrictEqual(declaration, { sweep: { cycle: 86400, intervals: 24 } })
})

it('should split a cycle into one interval by default', () => {
  const declaration = manifest({ sweep: { cycle: 3600 } } as any, component)

  assert.deepStrictEqual(declaration, { sweep: { cycle: 3600, intervals: 1 } })
})

it('should expand the shorthand', () => {
  const declaration = manifest({ sweep: 3600 } as any, component)

  assert.deepStrictEqual(declaration, { sweep: { cycle: 3600, intervals: 1 } })
})

it('should answer a component that only delays calls', () => {
  assert.deepStrictEqual(manifest(null, component), {})
})

it('should refuse an undefined operation', () => {
  assert.throws(() => manifest({ nothing: 3600 } as any, component),
    /refers to undefined operation 'nothing'/)
})

it('should refuse an operation that produces no side effects', () => {
  assert.throws(() => manifest({ peek: 3600 } as any, component),
    /of the allowed types/)
})

it('should refuse an interval shorter than a second', () => {
  assert.throws(() => manifest({ sweep: { cycle: 60, intervals: 61 } }, component),
    /less than a second/)
})

it('should refuse a cycle of no time at all', () => {
  assert.throws(() => manifest({ sweep: { cycle: 0, intervals: 1 } }, component))
})

it('should refuse what the declaration does not describe', () => {
  assert.throws(() => manifest({ sweep: { cycle: 60, every: 3 } } as any, component))
})

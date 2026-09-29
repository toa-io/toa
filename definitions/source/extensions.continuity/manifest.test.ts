import { it } from 'node:test'
import assert from 'node:assert/strict'
import { manifest } from './manifest.ts'
import type { Manifest } from '@toa.io/norm'

const component = {
  operations: {
    onboard: { type: 'effect' },
    transit: { type: 'transition' }
  }
} as unknown as Manifest

it('should answer the declaration', () => {
  assert.deepStrictEqual(manifest({ onboard: 604800 }, component), { onboard: 604800 })
})

it('should refuse an undefined operation', () => {
  assert.throws(
    () => manifest({ nothing: 600 }, component),
    /refers to undefined operation 'nothing'/
  )
})

it('should refuse what is not an effect', () => {
  assert.throws(() => manifest({ transit: 600 }, component), /'transit' is not an effect/)
})

it('should refuse a window under ten minutes', () => {
  assert.throws(
    () => manifest({ onboard: 599 }, component),
    /Invalid continuity declaration/
  )
})

it('should refuse a window that is not whole seconds', () => {
  assert.throws(
    () => manifest({ onboard: 600.5 }, component),
    /Invalid continuity declaration/
  )
})

it('should refuse a window that is not stated', () => {
  assert.throws(
    () => manifest({ onboard: true } as any, component),
    /Invalid continuity declaration/
  )
})

it('should refuse a declaration of nothing', () => {
  assert.throws(() => manifest(null, component), /Invalid continuity declaration/)
  assert.throws(() => manifest({}, component), /Invalid continuity declaration/)
})

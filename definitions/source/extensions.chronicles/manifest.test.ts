import { it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.ts'
import type { Manifest } from '@toa.io/norm'

const component = {
  name: 'orders',
  namespace: 'store',
  events: { created: {}, sync: {}, snapshot: {} }
} as unknown as Manifest

it('should be the labels a component names', () => {
  assert.deepEqual(manifest(['created', 'snapshot'], component), ['created', 'snapshot'])
})

it('should be none for a component that only sends', () => {
  assert.deepEqual(manifest(null, component), [])
  assert.deepEqual(manifest([], component), [])
})

it('should refuse a label that is not an event of the component', () => {
  assert.throws(
    () => manifest(['shipped'], component),
    /Chronicles of 'store.orders' name 'shipped', which is not an event of the component/
  )
})

it('should refuse a label twice', () => {
  assert.throws(
    () => manifest(['created', 'created'], component),
    /Invalid chronicles declaration/
  )
})

import { it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.ts'
import type { Manifest } from '@toa.io/norm'

const component = {
  name: 'orders',
  namespace: 'store',
  entity: { properties: { customer: {}, total: {} } },
  events: { created: {}, sync: {}, snapshot: {} }
} as unknown as Manifest

it('should be the events a component names, from a list of them', () => {
  assert.deepEqual(manifest(['created', 'snapshot'], component), {
    events: ['created', 'snapshot'],
    identity: 'identity'
  })
})

it('should be the events and the state a component names', () => {
  assert.deepEqual(manifest({ events: ['created'], state: 'sync' }, component), {
    events: ['created'],
    state: 'sync',
    identity: 'identity'
  })
})

it('should be none for a component that only sends', () => {
  assert.deepEqual(manifest(null, component), { events: [], identity: 'identity' })
  assert.deepEqual(manifest([], component), { events: [], identity: 'identity' })
})

it('should refuse a state that is not an event of the component', () => {
  assert.throws(
    () => manifest({ events: [], state: 'whole' }, component),
    /Chronicles of 'store.orders' name 'whole', which is not an event of the component/
  )
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

it('should take the identity from the property a component names, or none', () => {
  assert.equal(
    manifest({ events: [], identity: 'customer' }, component).identity,
    'customer'
  )
  assert.equal(manifest({ events: [], identity: null }, component).identity, null)
})

it('should refuse an identity that is not a property of the entity', () => {
  assert.throws(
    () => manifest({ events: [], identity: 'buyer' }, component),
    /name the identity 'buyer', which is not a property of the entity/
  )
})

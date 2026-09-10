import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { evict } from '../../src/.context/index.js'
import * as fixtures from './evict.fixtures.js'

/** @type {toa.norm.Context} */
let context

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should keep a context that evicts nothing', () => {
  evict(context)

  assert.deepStrictEqual(context, fixtures.context)
})

it('should drop an evicted component', () => {
  context.evicted = { components: ['a.b'] }

  evict(context)

  assert.deepStrictEqual(
    context.components.map((component) => component.locator.id),
    ['b.a', 'd.c']
  )
})

it('should drop an evicted component from a composition that lists it', () => {
  context.evicted = { components: ['a.b'] }

  evict(context)

  assert.deepStrictEqual(context.compositions[0].components, ['b.a'])
})

it('should leave a composition of evicted components alone empty', () => {
  context.evicted = { components: ['d.c'] }

  evict(context)

  assert.deepStrictEqual(context.compositions[1].components, [])
})

it('should refuse an unknown component', () => {
  context.evicted = { components: ['d.a'] }

  assert.throws(() => evict(context), {
    message: "'evicted' names an unknown component 'd.a'."
  })
})

it('should drop an evicted service from a composition that runs it', () => {
  context.evicted = { services: ['@toa.io/extensions.exposition'] }

  evict(context)

  assert.deepStrictEqual(context.compositions[0].services, [
    '@toa.io/extensions.realtime'
  ])
})

it('should leave no services where every one is evicted', () => {
  context.evicted = {
    services: ['@toa.io/extensions.exposition', '@toa.io/extensions.realtime']
  }

  evict(context)

  assert.strictEqual('services' in context.compositions[0], false)
})

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

it('should mark an evicted component and keep it', () => {
  context.evicted = { components: ['a.b'] }

  evict(context)

  assert.deepStrictEqual(
    context.components.map((component) => [component.locator.id, component.evicted === true]),
    [
      ['a.b', true],
      ['b.a', false],
      ['d.c', false]
    ]
  )
})

it('should keep an evicted component in a composition that lists it', () => {
  context.evicted = { components: ['a.b', 'd.c'] }

  evict(context)

  assert.deepStrictEqual(context.compositions[0].components, ['a.b', 'b.a'])
  assert.deepStrictEqual(context.compositions[1].components, ['d.c'])
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

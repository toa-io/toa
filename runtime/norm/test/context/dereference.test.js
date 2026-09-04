import { it, before } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { dereference } from '../../src/.context/index.js'
import * as fixtures from './dereference.fixtures.js'

/** @type {toa.norm.Context} */
let context

before(() => {
  context = clone(fixtures.context)
  dereference(context)
})

it('should dereference', () => {
  assert.partialDeepStrictEqual(context, fixtures.expected)
})

it('should not throw on empty compositions', () => {
  context.compositions = undefined

  assert.doesNotThrow(() => dereference(context))
})

it('should throw on an unknown component', () => {
  const broken = clone(fixtures.context)

  broken.compositions[1].components.push('nope.here')

  assert.throws(() => dereference(broken),
    { message: "Composition 'bar' lists an unknown component 'nope.here'." })
})

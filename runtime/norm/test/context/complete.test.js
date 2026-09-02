import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import clone from 'clone-deep'

import { complete } from '../../src/.context/index.js'
import * as fixtures from './complete.fixtures.js'

/** @type {toa.norm.Context} */
let context

beforeEach(() => {
  context = clone(fixtures.context)
  complete(context)
})

it('should complete compositions', () => {
  assert.deepStrictEqual(context.compositions.length, fixtures.compositions.length)
  assert.ok(fixtures.compositions.every((item) => context.compositions.some((candidate) => isDeepStrictEqual(candidate, item))))
})

it('should create if compositions are not set', () => {
  context.compositions = undefined

  const compositions = context.components.map((component) => ({
    name: component.locator.label,
    components: [component]
  }))

  assert.doesNotThrow(() => complete(context))
  assert.deepStrictEqual(context.compositions, compositions)
})

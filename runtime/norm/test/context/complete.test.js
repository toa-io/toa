'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const clone = require('clone-deep')

const { complete } = require('../../src/.context')
const fixtures = require('./complete.fixtures')

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

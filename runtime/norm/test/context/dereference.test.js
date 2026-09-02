'use strict'

const { it, before } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')

const { dereference } = require('../../src/.context')
const fixtures = require('./dereference.fixtures')

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

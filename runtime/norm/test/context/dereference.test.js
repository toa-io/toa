'use strict'

const clone = require('clone-deep')

const { dereference } = require('../../src/.context')
const fixtures = require('./dereference.fixtures')

/** @type {toa.norm.Context} */
let context

beforeAll(() => {
  context = clone(fixtures.context)
  dereference(context)
})

it('should dereference', () => {
  expect(context).toEqual(expect.objectContaining(fixtures.expected))
})

it('should not throw on empty compositions', () => {
  context.compositions = undefined

  expect(() => dereference(context)).not.toThrow()
})

'use strict'

const clone = require('clone-deep')

const { complete } = require('../../src/context/complete')
const fixtures = require('./complete.fixtures')

/** @type {toa.formation.Context} */
let context

beforeEach(() => {
  context = clone(fixtures.context)
  complete(context)
})

it('should complete compositions', () => {
  expect(context.compositions.length).toEqual(fixtures.compositions.length)
  expect(context.compositions).toEqual(expect.arrayContaining(fixtures.compositions))
})

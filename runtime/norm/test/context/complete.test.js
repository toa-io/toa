'use strict'

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
  expect(context.compositions.length).toEqual(fixtures.compositions.length)
  expect(context.compositions).toEqual(expect.arrayContaining(fixtures.compositions))
})

it('should create if compositions are not set', () => {
  context.compositions = undefined

  const compositions = context.components.map((component) => ({
    name: component.locator.label,
    components: [component]
  }))

  expect(() => complete(context)).not.toThrow()
  expect(context.compositions).toStrictEqual(compositions)
})

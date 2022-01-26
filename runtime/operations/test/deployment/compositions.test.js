'use strict'

const fixtures = require('./copositions.fixtures')
const { Compositions } = require('../../src/deployment/compositions')

const clone = require('clone-deep')

let context, compositions

beforeEach(() => {
  context = clone(fixtures.context)
  compositions = new Compositions(context, fixtures.instantiate)
})

it('should instantiate', () => {
  expect(fixtures.instantiate).toHaveBeenCalledTimes(context.compositions.length)
})

it('should be iterable over instances', () => {
  expect(Symbol.iterator in compositions).toEqual(true)

  for (const composition of compositions) expect(fixtures.instantiate).toHaveReturnedWith(composition)
})

it('should complete compositions', () => {
  expect(context.compositions.length).toBeGreaterThan(fixtures.context.compositions.length)

  const used = new Set(context.compositions.map((composition) => composition.components).flat())

  expect(used.size).toEqual(context.components.length)
})

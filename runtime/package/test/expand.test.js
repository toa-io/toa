'use strict'

const clone = require('clone-deep')

const { expand } = require('../src/expand')
const fixtures = require('./expand.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', () => {
  expand(source)
  expect(source).toStrictEqual(fixtures.target)
})

it('should expand operation arguments', () => {
  const source = { entity: { schema: {} }, operations: [{ input: 'object', output: 'string' }] }

  expand(source)
  expect(source.operations).toStrictEqual([{ input: { type: 'object' }, output: { type: 'string' } }])
})

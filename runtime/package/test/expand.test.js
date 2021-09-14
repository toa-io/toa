'use strict'

const clone = require('clone-deep')

const { expand } = require('../src/expand')
const fixtures = require('./expamd.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', () => {
  expand(source)
  expect(source).toStrictEqual(fixtures.target)
})

it('should throw on invalid reference', () => {
  source.operations[0].output.properties.bar = null
  expect(() => expand(source)).toThrow(/is not defined/)

  source.operations[0].output.properties.bar = '~bar'
  expect(() => expand(source)).toThrow(/is not defined/)
})

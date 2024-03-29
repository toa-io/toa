'use strict'

const clone = require('clone-deep')

const { dereference } = require('../../src/.component')
const fixtures = require('./dereference.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should dereference', () => {
  dereference(source)

  expect(source).toStrictEqual(fixtures.target)
})

it('should throw on invalid schema reference', () => {
  source.operations.transit.output.properties.baz = { type: 'string', default: '.' }
  expect(() => dereference(source)).toThrow(/is not defined/)

  source.operations.transit.output.properties.baz = { type: 'string', default: '.baz' }
  expect(() => dereference(source)).toThrow(/is not defined/)
})

it('should throw on invalid forwarding', () => {
  source.operations.create.forward = 'foo'
  expect(() => dereference(source)).toThrow(/is not defined/)
})

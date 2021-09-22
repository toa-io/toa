'use strict'

const clone = require('clone-deep')

const { dereference } = require('../src/dereference')
const fixtures = require('./dereference.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should dereference', () => {
  dereference(source)

  expect(source).toStrictEqual(fixtures.target)
})

it('should throw on invalid reference', () => {
  source.operations[0].output.properties.bar = null
  expect(() => dereference(source)).toThrow(/is not defined/)

  source.operations[0].output.properties.bar = '~bar'
  expect(() => dereference(source)).toThrow(/is not defined/)
})

'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./suite.translate.fixtures')
const { translate } = require('../src/.suite/translate')

it('should be', () => {
  expect(translate).toBeDefined()
})

/** @type {toa.samples.Declaration} */
let declaration

/** @type {toa.samples.Sample} */
let sample

/** @type {toa.samples.Suite} */
let expected

beforeEach(() => {
  declaration = clone(fixtures.declaration)
  expected = clone(fixtures.expected)
  sample = translate(fixtures.declaration)
})

it('should translate input', () => {
  expect(sample).toStrictEqual(expected)
})

describe('validation', () => {
  it('should not allow additional properties', () => {
    declaration.foo = generate()

    expect(() => translate(declaration)).toThrow('additional property \'foo\'')
  })

  it('should require output', () => {
    delete declaration.output

    expect(() => translate(declaration)).toThrow('required property \'output\'')
  })
})

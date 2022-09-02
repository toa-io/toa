'use strict'

const { generate } = require('randomstring')
const { translate } = require('../src/.suite/translate')

it('should be', () => {
  expect(translate).toBeDefined()
})

const title = generate()
const input = generate()
const output = generate()
const request = { input }
const reply = { output }
const expected = { title, request, reply }

/** @type {toa.samples.Declaration} */
let declaration

/** @type {toa.samples.Sample} */
let sample

beforeEach(() => {
  declaration = { title, input, output }
  sample = translate(declaration)
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

'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./replay.translate.operation.fixtures')
const { operation: translate } = require('../src/.replay/translate')

it('should be', () => {
  expect(translate).toBeDefined()
})

/** @type {toa.samples.Operation} */
let declaration

/** @type {toa.sampling.request.Sample} */
let sample

/** @type {toa.sampling.request.Sample} */
let expected

beforeEach(() => {
  declaration = clone(fixtures.declaration)
  expected = clone(fixtures.expected)
  sample = translate(declaration)
})

it('should translate input', () => {
  expect(sample).toStrictEqual(expected)
})

it('should create empty request', async () => {
  delete declaration.input

  sample = translate(declaration)

  expect(sample.request).toStrictEqual({})
})

describe('validation', () => {
  it('should not allow additional properties', () => {
    declaration.foo = generate()

    expect(() => translate(declaration)).toThrow('additional property \'foo\'')
  })
})

describe('specials', () => {
  it('should transform configuration object to permanent sample', async () => {
    const configuration = { foo: generate() }
    const declaration = { configuration }
    const sample = translate(declaration)

    expect(sample.extensions.configuration).toStrictEqual([{
      result: configuration,
      permanent: true
    }])
  })

  it('should throw if configuration provided twice', async () => {
    const configuration = { foo: generate() }

    const declaration = {
      configuration,
      extensions: {
        configuration: [{
          result: configuration
        }]
      }
    }

    expect(() => translate(declaration)).toThrow('ambiguous')
  })
})

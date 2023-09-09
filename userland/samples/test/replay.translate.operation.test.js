'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./replay.translate.operation.fixtures')
const { operation: translate } = require('../src/.replay/.suite/translate')

it('should be', () => {
  expect(translate).toBeDefined()
})

/** @type {toa.samples.Operation} */
let declaration

/** @type {toa.sampling.Request} */
let request

/** @type {toa.sampling.request.Sample} */
let expected

const autonomous = true

beforeEach(() => {
  declaration = clone(fixtures.declaration)
  expected = clone(fixtures.expected)
  request = translate(declaration, autonomous)
})

it('should translate input', () => {
  expect(request).toStrictEqual(expected)
})

describe('validation', () => {
  it('should not allow additional properties', () => {
    declaration.foo = generate()

    expect(() => translate(declaration, true)).toThrow('not expected')
  })
})

describe('specials', () => {
  it('should transform configuration object to permanent sample', async () => {
    const configuration = { foo: generate() }
    const declaration = /** @type {toa.samples.Operation} */ { configuration }
    const request = translate(declaration, true)

    expect(request.sample.extensions.configuration).toStrictEqual([{
      result: configuration,
      permanent: true
    }])
  })

  it('should throw if configuration is provided twice', async () => {
    const configuration = { foo: generate() }

    const declaration = {
      configuration,
      extensions: {
        configuration: [{
          result: configuration
        }]
      }
    }

    expect(() => translate(declaration, true)).toThrow('ambiguous')
  })
})

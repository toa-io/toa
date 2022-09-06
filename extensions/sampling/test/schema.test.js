'use strict'

const { SampleException } = require('../src/exceptions')
const { validate } = require('../src/schema')

it('should be', () => {
  expect(validate).toBeDefined()
})

/** @type {toa.sampling.Sample} */
let sample

beforeEach(() => {
  sample = {}
})

it('should not throw on undefined', () => {
  expect(() => validate(undefined)).not.toThrow()
})

describe('reply', () => {
  it('should throw on additional property', () => {
    const sample = { reply: { wrong: 1 } }

    // noinspection JSCheckFunctionSignatures
    expect(() => validate(sample)).toThrow(SampleException)
  })
})

describe('context', () => {
  let local

  beforeEach(() => {
    local = {
      do: {
        input: 1,
        reply: {
          output: 2
        }
      }
    }

    sample.context = { local }
  })

  it('should not throw on local calls', () => {
    const exception = validate(sample)
    expect(exception).toBeUndefined()
  })

  it('should not throw on remote calls', () => {
    sample.context.remote = local

    const exception = validate(sample)
    expect(exception).toBeUndefined()
  })
})

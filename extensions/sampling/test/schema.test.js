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
    /** @type {toa.sampling.sample.Calls} */
    local = {
      do: [
        {
          request: {
            input: 1
          },
          reply: {
            output: 2
          }
        }
      ]
    }

    sample.context = { local }
  })

  it('should not throw on local calls', () => {
    expect(() => validate(sample)).not.toThrow()
  })

  it('should not throw on remote calls', () => {
    sample.context.remote = local

    expect(() => validate(sample)).not.toThrow()
  })

  it('should throw on invalid context sample', () => {
    sample.context.foo = 1

    expect(() => validate(sample)).toThrow(SampleException)
  })
})

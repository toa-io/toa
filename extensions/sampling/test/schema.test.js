'use strict'

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
  const exception = validate(undefined)

  expect(exception).toBeUndefined()
})

describe('reply', () => {
  it('should throw on additional property', () => {
    const sample = { reply: { ok: 1 } }
    // noinspection JSCheckFunctionSignatures
    const exception = validate(sample)

    expect(exception).toBeDefined()
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

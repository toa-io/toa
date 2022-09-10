'use strict'

const { SampleException } = require('../src/exceptions')
const { validate } = require('../src/schema')
const { generate } = require('randomstring')

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

describe('storage', () => {
  beforeEach(() => {
    sample.storage = {}
  })

  describe('current', () => {
    it('should not throw on object', async () => {
      sample.storage.current = { foo: generate() }

      expect(() => validate(sample)).not.toThrow()
    })

    it('should not throw on array', async () => {
      sample.storage.current = [{ foo: generate() }]

      expect(() => validate(sample)).not.toThrow()
    })

    it('should throw on invalid type', async () => {
      sample.storage.current = 1

      expect(() => validate(sample)).toThrow('must be object')
    })
  })

  describe('next', () => {
    it('should not throw on object', async () => {
      sample.storage.next = { foo: generate() }

      expect(() => validate(sample)).not.toThrow()
    })

    it('should throw on invalid type', async () => {
      sample.storage.next = [{ foo: generate() }]
      expect(() => validate(sample)).toThrow('must be object')

      sample.storage.next = 1
      expect(() => validate(sample)).toThrow('must be object')
    })
  })
})

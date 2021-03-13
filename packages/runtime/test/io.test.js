'use strict'

const clone = require('clone-deep')

const { Factory } = require('../src/io')
const fixtures = require('./io.fixtures')

let factory
let io

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schemas)
  io = factory.create().io
})

it('should contain channels', () => {
  expect(Object.keys(io)).toEqual(['input', 'output', 'error'])
})

it('should seal io', () => {
  expect(() => (io.foo = 'bar')).toThrow(/not extensible/)
})

it('should assign defaults', () => {
  expect(io.output).toEqual(fixtures.schemas.output.defaults.mock.results[0].value)
  expect(io.error).toEqual(fixtures.schemas.error.defaults.mock.results[0].value)
})

describe('input', () => {
  const input = { foo: 'bar' }

  beforeEach(() => {
    io = factory.create(input).io
  })

  it('should assign input', () => {
    expect(io.input).toEqual(input)
  })

  it('should freeze input', () => {
    expect(Object.isFrozen(io.input)).toBe(true)
  })

  it('should validate input', () => {
    expect(fixtures.schemas.input.fit).toHaveBeenCalledWith(input)
  })

  describe('errors', () => {
    const input = { invalid: true }

    let oh

    beforeEach(() => {
      jest.clearAllMocks()

      const result = factory.create(input)

      io = result.ok
      oh = result.oh
    })

    it('should return oh', () => {
      expect(oh).toEqual(fixtures.schemas.input.fit.mock.results[0].value.oh)
    })
  })
})

describe('fit', () => {
  const output = { foo: 'bar' }
  const error = { bar: 'foo' }

  beforeEach(() => {
    jest.clearAllMocks()

    io.output = clone(output)
    io.error = clone(error)
  })

  it('should freeze', () => {
    io.fit()

    expect(Object.isFrozen(io.output)).toBe(true)
    expect(Object.isFrozen(io.error)).toBe(true)
  })

  it('should validate', () => {
    io.fit()

    expect(fixtures.schemas.output.fit).toHaveBeenCalledWith(output)
    expect(fixtures.schemas.error.fit).toHaveBeenCalledWith(error)
  })

  describe('errors', () => {
    it('should throw on invalid output', () => {
      io.output = { invalid: true }

      expect(() => io.fit()).toThrow()
    })

    it('should throw on invalid error', () => {
      io.error = { invalid: true }

      expect(() => io.fit()).toThrow()
    })
  })
})

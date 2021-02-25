'use strict'

const { IO } = require('../src/io')

let io

beforeEach(() => (io = new IO()))

describe('input/output', () => {
  const SIGNALS = ['input', 'output', 'error']

  it('should provide signals', () => {
    SIGNALS.forEach(signal =>
      expect(typeof io[signal]).toBe('object')
    )
  })

  it('should assign initial input', () => {
    const input = { test: Math.random() }

    io = new IO(input)

    expect(io.input).toEqual(input)
  })

  it('should forbid signals assignment', () => {
    SIGNALS.forEach(signal =>
      expect(() => {
        io[signal] = { new: 1 }
      }).toThrow(/read only property/)
    )
  })

  it('should forbid extension', () => {
    expect(() => (io.foo = 1)).toThrow(/not extensible/)
  })

  it('should close input', () => {
    io.close()

    expect(() => (io.input.foo = 1)).toThrow(/not extensible/)
  })

  it('should freeze', () => {
    io.error.foo = 1
    io.freeze()

    expect(() => (io.output.foo = 1)).toThrow(/undefined/)
    expect(() => (io.error.bar = 1)).toThrow(/not extensible/)
  })

  it('should delete output/error on freeze if no properties assigned', () => {
    io.freeze()

    expect(io.output).toBeUndefined()
    expect(io.error).toBeUndefined()
  })
})

import IO from '../src/io'

describe('Signals', () => {
  const SIGNALS = ['input', 'output', 'error']

  let io

  beforeEach(() => (io = new IO()))

  it('should provide signals', () => {
    SIGNALS.forEach(signal =>
      expect(typeof io[signal]).toBe('object')
    )
  })

  it('should forbid signals assignment', () => {
    SIGNALS.forEach(signal =>
      expect(() => (io[signal] = {})).toThrow(/read only property/)
    )
  })

  it('should forbid extension', () => {
    expect(() => (io.foo = 1)).toThrow(/not extensible/)
  })

  it('should close input', () => {
    io.close()

    expect(() => (io.input.foo = 1)).toThrow()
  })
})

import IO from '../src/io'

let io

beforeEach(() => (io = new IO()))

describe('input/output', () => {
  const SIGNALS = ['input', 'output']

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

describe('error', () => {

  it('should allow error assignment', () => {
    io.error = new Error('ok')
    expect(io.error).toBeInstanceOf(Error)
  })

  it('should throw on non Error type', () => {
    const assign = () => (io.error = {})

    expect(assign).toThrow(/instance of Error/)
  })

  it('should throw on overwrite', () => {
    io.error = new Error('1')
    const assign = () => (io.error = new Error('2'))

    expect(assign).toThrow(/only once/)
  })

})

'use strict'

const fixtures = require('./connector.fixtures')

let sequence

beforeEach(() => {
  sequence = []
})

describe('callbacks', () => {
  let a

  beforeEach(() => {
    a = new fixtures.TestConnector('a', sequence)
  })

  it('should call connection', async () => {
    await a.connect()
    expect(sequence).toEqual(['+a'])
  })

  it('should call disconnection', async () => {
    await a.connect()
    await a.disconnect()

    expect(sequence.indexOf('+a')).toBeLessThan(sequence.indexOf('-a'))
  })

  it('should reconnect', async () => {
    await a.connect()
    await a.disconnect()
    await a.connect()
    await a.disconnect()
    await a.connect()

    expect(sequence).toEqual(['+a', '-a', '*a', '+a', '-a', '*a', '+a'])
  })
})

describe('dependencies', () => {
  let a
  let b
  let c
  let d

  beforeEach(() => {
    a = new fixtures.TestConnector('a', sequence)
    b = new fixtures.TestConnector('b', sequence)
    c = new fixtures.TestConnector('c', sequence)
    d = new fixtures.TestConnector('d', sequence)
  })

  it('should wait dependencies on connection', async () => {
    a.depends(b).depends(c)
    a.depends(d)

    await a.connect()

    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+b'))
    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+a'))
    expect(sequence.indexOf('+d')).toBeLessThan(sequence.indexOf('+a'))
  })

  it('should wait array of connectors', async () => {
    a.depends([b, d])
    b.depends(c)
    d.depends(c)

    await a.connect()

    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+b'))
    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+d'))
    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+a'))
    expect(sequence.indexOf('+d')).toBeLessThan(sequence.indexOf('+a'))
  })

  it('should wait array(1) of connectors', async () => {
    a.depends([b])
    b.depends(c)

    await a.connect()

    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+b'))
    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+a'))
  })

  it('should not throw on empty array', async () => {
    a.depends([])

    await a.connect()

    expect(sequence).toStrictEqual(['+a'])
  })

  it('should await 2-way dependencies', async () => {
    a.depends([b, c, d])
    d.depends([b, c])

    await a.connect()

    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+a'))
    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+a'))
    expect(sequence.indexOf('+d')).toBeLessThan(sequence.indexOf('+a'))

    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+d'))
    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+d'))
  })

  it('should disconnect before dependencies', async () => {
    a.depends(b).depends(c)
    b.depends(d)

    await a.disconnect()

    expect(sequence.indexOf('-a')).toBeLessThan(sequence.indexOf('-b'))
    expect(sequence.indexOf('-b')).toBeLessThan(sequence.indexOf('-c'))
    expect(sequence.indexOf('-b')).toBeLessThan(sequence.indexOf('-d'))
  })

  it('should call disconnected', async () => {
    a.depends(b).depends(c)
    b.depends(d)

    await a.disconnect()

    expect(sequence.indexOf('*c')).toBeLessThan(sequence.indexOf('*b'))
    expect(sequence.indexOf('*b')).toBeLessThan(sequence.indexOf('*a'))
    expect(sequence.indexOf('*d')).toBeLessThan(sequence.indexOf('*b'))
    expect(sequence.indexOf('*a')).toBe(sequence.length - 1)
  })

  it('should not throw if depends not on Connector', async () => {
    a.depends({})

    await expect((async () => {
      await a.connect()
      await a.disconnect()
    })()).resolves.not.toThrow()

    b.depends([undefined, c, {}])

    await expect((async () => {
      await b.connect()
      await b.disconnect()
    })()).resolves.not.toThrow()

    expect(sequence).toStrictEqual([
      '+a', '-a', '*a',
      '+c', '+b', '-b', '-c', '*c', '*b'
    ])
  })

  describe('errors', () => {
    let f

    beforeEach(() => {
      f = new fixtures.FailingConnector()
    })

    it('should disconnect on fail', async () => {
      f.depends(b).depends(c)

      await expect(f.connect()).rejects.toThrow('FailingConnector')
      expect(sequence).toEqual(['+c', '+b', '-b', '-c', '*c', '*b'])
    })

    it('should interrupt connection chain', async () => {
      a.depends(f).depends(c)
      f.depends(d)

      await expect(a.connect()).rejects.toThrow('FailingConnector')

      expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('-c'))
      expect(sequence.indexOf('+d')).toBeLessThan(sequence.indexOf('-d'))

      expect(sequence.indexOf('+a')).toBe(-1)
      expect(sequence.indexOf('-a')).toBe(-1)
    })
  })
})

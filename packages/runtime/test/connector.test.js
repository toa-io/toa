'use strict'

const assets = require('./connector.assets')

let sequence

beforeEach(() => {
  sequence = []
})

describe('callbacks', () => {
  let a

  beforeEach(() => {
    a = new assets.TestConnector('a', sequence)
  })

  it('should call connection', async () => {
    await a.connect()
    expect(sequence).toEqual(['+a'])
  })

  it('should call disconnection', async () => {
    await a.connect()
    await a.disconnect()
    expect(sequence).toEqual(['+a', '-a'])
  })
})

describe('dependencies', () => {
  let a
  let b
  let c
  let d

  beforeEach(() => {
    a = new assets.TestConnector('a', sequence)
    b = new assets.TestConnector('b', sequence)
    c = new assets.TestConnector('c', sequence)
    d = new assets.TestConnector('d', sequence)
  })

  it('should wait dependencies on connection', async () => {
    a.depends(b).depends(c)
    a.depends(d)

    await a.connect()

    expect(sequence.indexOf('+c')).toBeLessThan(sequence.indexOf('+b'))
    expect(sequence.indexOf('+b')).toBeLessThan(sequence.indexOf('+a'))
    expect(sequence.indexOf('+d')).toBeLessThan(sequence.indexOf('+a'))
  })

  it('should disconnect before dependencies', async () => {
    a.depends(b).depends(c)
    a.depends(d)

    await a.disconnect()

    expect(sequence.indexOf('-a')).toBeLessThan(sequence.indexOf('-b'))
    expect(sequence.indexOf('-b')).toBeLessThan(sequence.indexOf('-c'))
    expect(sequence.indexOf('-a')).toBeLessThan(sequence.indexOf('-d'))
  })
})

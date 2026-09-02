import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { timeout } from '@toa.io/generic'

import * as fixtures from './connector.fixtures.js'

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
    assert.deepStrictEqual(sequence, ['+a'])
  })

  it('should call disconnection', async () => {
    await a.connect()
    await a.disconnect()

    assert.ok(sequence.indexOf('+a') < sequence.indexOf('-a'))
  })

  it('should reconnect', async () => {
    await a.connect()
    await a.reconnect()
    await a.reconnect()

    assert.deepStrictEqual(sequence, ['+a', '-a', '*a', '+a', '-a', '*a', '+a'])
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

    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+b'))
    assert.ok(sequence.indexOf('+b') < sequence.indexOf('+a'))
    assert.ok(sequence.indexOf('+d') < sequence.indexOf('+a'))
  })

  it('should wait array of connectors', async () => {
    a.depends([b, d])
    b.depends(c)
    d.depends(c)

    await a.connect()

    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+b'))
    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+d'))
    assert.ok(sequence.indexOf('+b') < sequence.indexOf('+a'))
    assert.ok(sequence.indexOf('+d') < sequence.indexOf('+a'))
  })

  it('should wait array(1) of connectors', async () => {
    a.depends([b])
    b.depends(c)

    await a.connect()

    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+b'))
    assert.ok(sequence.indexOf('+b') < sequence.indexOf('+a'))
  })

  it('should throw on empty array', async () => {
    assert.throws(() => a.depends([]), (error) => /must not be empty/.test(error.message))
  })

  it('should await 2-way dependencies', async () => {
    a.depends([b, c, d])
    d.depends([b, c])

    await a.connect()

    assert.ok(sequence.indexOf('+b') < sequence.indexOf('+a'))
    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+a'))
    assert.ok(sequence.indexOf('+d') < sequence.indexOf('+a'))

    assert.ok(sequence.indexOf('+b') < sequence.indexOf('+d'))
    assert.ok(sequence.indexOf('+c') < sequence.indexOf('+d'))
  })

  it('should disconnect before dependencies', async () => {
    a.depends(b).depends(c)
    b.depends(d)

    await a.connect()
    await a.disconnect()

    assert.ok(sequence.indexOf('-a') < sequence.indexOf('-b'))
    assert.ok(sequence.indexOf('-b') < sequence.indexOf('-c'))
    assert.ok(sequence.indexOf('-b') < sequence.indexOf('-d'))
  })

  it('should call disconnected', async () => {
    a.depends(b).depends(c)
    b.depends(d)

    await a.disconnect()

    assert.ok(sequence.indexOf('*c') < sequence.indexOf('*b'))
    assert.ok(sequence.indexOf('*b') < sequence.indexOf('*a'))
    assert.ok(sequence.indexOf('*d') < sequence.indexOf('*b'))
    assert.strictEqual(sequence.indexOf('*a'), sequence.length - 1)
  })

  it('should disconnect if no parents left', async () => {
    a.depends(c)
    b.depends(c)

    await a.connect()
    await b.connect()

    assert.deepStrictEqual(sequence, ['+c', '+a', '+b'])

    await a.disconnect()

    assert.deepStrictEqual(sequence, ['+c', '+a', '+b', '-a', '*a'])

    await b.disconnect()

    assert.deepStrictEqual(sequence, ['+c', '+a', '+b', '-a', '*a', '-b', '-c', '*c', '*b'])
  })

  it('should throw if depends not on Connector', async () => {
    assert.throws(() => a.depends({}))
  })

  it('should disconnect while still connecting', async () => {
    const stuck = new fixtures.StuckConnector()

    a.depends(stuck).depends(b)

    void a.connect()

    while (b.connected !== true) await timeout(1)

    // `a` never connects, and disconnecting must not wait for it to
    assert.deepStrictEqual(a.connected, false)

    await a.disconnect()

    assert.deepStrictEqual(sequence, ['+b', '-b', '*b', '*a'])
  })

  describe('errors', () => {
    let f

    beforeEach(() => {
      f = new fixtures.FailingConnector()
    })

    it('should disconnect on fail', async () => {
      f.depends(b).depends(c)

      await assert.rejects(f.connect(), (error) => /FailingConnector/.test(error.message))
      assert.deepStrictEqual(sequence, ['+c', '+b', '-b', '-c', '*c', '*b'])
    })

    it('should interrupt connection chain', async () => {
      a.depends(f).depends(c)
      f.depends(d)

      await assert.rejects(a.connect(), (error) => /FailingConnector/.test(error.message))

      assert.ok(sequence.indexOf('+c') < sequence.indexOf('-c'))
      assert.ok(sequence.indexOf('+d') < sequence.indexOf('-d'))

      assert.strictEqual(sequence.indexOf('+a'), -1)
      assert.strictEqual(sequence.indexOf('-a'), -1)
    })
  })
})

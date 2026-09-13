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
    assert.throws(
      () => a.depends([]),
      (error) => /must not be empty/.test(error.message)
    )
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

    assert.deepStrictEqual(sequence, [
      '+c',
      '+a',
      '+b',
      '-a',
      '*a',
      '-b',
      '-c',
      '*c',
      '*b'
    ])
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

  it('should disconnect a dependency taken on after disconnection', async () => {
    a.depends(b)

    await a.connect()
    await a.disconnect()

    // what a lookup that returns once the teardown walk has gone by amounts to
    a.depends(c)

    await c.connect()

    assert.strictEqual(c.connected, false)
    assert.ok(sequence.indexOf('*c') > sequence.indexOf('*a'))
  })

  it('should disconnect a connected dependency taken on after disconnection', async () => {
    a.depends(b)

    await a.connect()
    await a.disconnect()
    await c.connect()

    a.depends(c)

    // the discarding is not something the caller waits for
    for (let i = 0; c.connected && i < 100; i++) await timeout(1)

    assert.strictEqual(c.connected, false)
    assert.ok(sequence.includes('*c'))
  })

  it('should not connect what was disconnected while connecting', async () => {
    const late = new fixtures.LateConnector()

    late.depends(c)
    b.depends(c)

    await b.connect()

    const connecting = late.connect()

    await late.disconnect()

    late.arrive()

    await connecting

    // the connection landed after the disconnection, and nothing is left to say it again
    assert.strictEqual(late.connected, false)

    await b.disconnect()

    assert.strictEqual(c.connected, false)
    assert.ok(sequence.includes('*c'))
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

describe('quiescence', () => {
  let a, b, c

  beforeEach(async () => {
    a = new fixtures.TestConnector('a', sequence)
    b = new fixtures.TestConnector('b', sequence)
    c = new fixtures.TestConnector('c', sequence)
  })

  it('should stop the tree from the top down', async () => {
    a.depends(b)
    b.depends(c)

    await a.connect()

    sequence.length = 0

    await a.halt()

    assert.deepStrictEqual(sequence, ['!a', '!b', '!c'])
  })

  it('should resume the tree from the bottom up', async () => {
    a.depends(b)
    b.depends(c)

    await a.connect()
    await a.halt()

    sequence.length = 0

    await a.restore()

    assert.deepStrictEqual(sequence, ['=c', '=b', '=a'])
  })

  it('should stop what two dependants share once', async () => {
    a.depends([b, c])
    b.depends(c)

    await a.connect()

    sequence.length = 0

    await a.halt()

    assert.deepStrictEqual(sequence.filter((entry) => entry === '!c').length, 1)
  })

  it('should be idempotent', async () => {
    a.depends(b)

    await a.connect()

    sequence.length = 0

    await a.halt()
    await a.halt()

    assert.deepStrictEqual(sequence, ['!a', '!b'])
  })

  it('should stop a dependency taken on after the walk', async () => {
    await a.connect()
    await a.halt()

    sequence.length = 0

    a.depends(b)

    await timeout(50)

    assert.deepStrictEqual(sequence, ['!b'])
  })

  it('should resume what a failing stop left', async () => {
    const unstoppable = new fixtures.UnstoppableConnector()

    a.depends(unstoppable)
    unstoppable.depends(b)

    await a.connect()

    sequence.length = 0

    await a.halt()
    await a.restore()

    assert.deepStrictEqual(sequence, ['!a', '!b', '=b', '=a'])
  })
})

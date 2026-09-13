import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Encoded } from '../source/encoded.ts'

describe('Encoded', () => {
  // a process may load this package twice — the gateway image has it beside the runtime and beside
  // the extension — and a module loaded again is what a second copy of the package is
  it('is recognised where another copy of the package made it', async () => {
    const copy = await import('../source/encoded.ts?copy')
    const encoded = new copy.Encoded(Buffer.from('{}'))

    assert.equal(encoded instanceof Encoded, false)
    assert.equal(Encoded.is(encoded), true)
  })

  it('is not an object that has its fields', () => {
    assert.equal(
      Encoded.is({ bytes: Buffer.from('{}'), type: 'application/json' }),
      false
    )
  })

  it('is not a value that is no object', () => {
    assert.equal(Encoded.is(null), false)
    assert.equal(Encoded.is('{}'), false)
  })
})

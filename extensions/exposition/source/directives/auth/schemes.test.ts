import { it } from 'node:test'
import assert from 'node:assert/strict'

import { providers } from './schemes.js'

it('should resolve a known scheme', () => {
  assert.deepEqual(providers('basic'), ['basic'])
  assert.deepEqual(providers('code'), ['federation'])
})

it('should resolve every provider claiming a scheme, in order', () => {
  assert.deepEqual(providers('bearer'), ['tokens', 'federation'])
})

it('should not resolve a property of Object.prototype', () => {
  for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty'])
    assert.equal(providers(name), undefined)
})

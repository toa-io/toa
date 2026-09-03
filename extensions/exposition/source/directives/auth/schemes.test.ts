import { it } from 'node:test'
import assert from 'node:assert/strict'

import { provider } from './schemes.js'

it('should resolve a known scheme', () => {
  assert.equal(provider('basic'), 'basic')
  assert.equal(provider('bearer'), 'federation')
})

it('should not resolve a property of Object.prototype', () => {
  for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty'])
    assert.equal(provider(name), undefined)
})

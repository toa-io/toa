import { it } from 'node:test'
import assert from 'node:assert/strict'

import { form } from './form.js'

it('should recognize a compact JWE by its five segments', () => {
  assert.equal(form('header.key.iv.ciphertext.tag'), 'jwe')
})

it('should recognize a legacy PASETO by its prefix', () => {
  assert.equal(form('v3.local.payload'), 'paseto')
})

it('should not recognize a JWS, which is what an id_token is', () => {
  assert.equal(form('header.payload.signature'), null)
})

it('should not recognize what is not a token at all', () => {
  for (const value of ['', 'token', 'header.key.iv.ciphertext.tag.extra'])
    assert.equal(form(value), null)
})

it('should read the shape and nothing else, leaving the rest to the verifier', () => {
  assert.equal(form('....'), 'jwe')
})

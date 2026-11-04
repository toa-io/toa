import { generateKeyPairSync } from 'node:crypto'
import { beforeEach, it } from 'node:test'
import assert from 'node:assert/strict'
import { environment } from '@toa.io/generic'

import { computation as issue } from './issue.ts'
import { computation as keys } from './keys.ts'
import { load } from './lib/jose.js'
import type { Context } from './types/index.ts'

const input = { authority: 'nex', sub: 'billing', audience: 'https://another.toa.io' }

let context: Context

beforeEach(() => {
  environment.set(
    'TOA_EXPOSITION_PROPERTIES',
    JSON.stringify({ authorities: { nex: 'nex.toa.io' } })
  )

  context = {
    configuration: { trust: [], keys: [key('k2'), key('k1')], lifetime: 600 },
    logs: { debug: () => undefined }
  } as unknown as Context
})

it('signs with the first key, as the issuer of the authority', async () => {
  const jose = await load()
  const reply = await issue(input, context)

  assert.ok(!(reply instanceof Error))

  const jwks = jose.createLocalJWKSet(await keys(null, context))
  const { payload, protectedHeader } = await jose.jwtVerify(reply.token, jwks, {
    issuer: 'https://nex.toa.io',
    audience: input.audience
  })

  assert.deepEqual(protectedHeader, { alg: 'ES256', kid: 'k2', typ: 'JWT' })
  assert.equal(payload.sub, 'billing')
  assert.equal(payload.exp, reply.exp)
  assert.equal(reply.exp - payload.iat!, 300)
  assert.equal(typeof payload.jti, 'string')
  assert.deepEqual(Object.keys(payload).sort(), [
    'aud',
    'exp',
    'iat',
    'iss',
    'jti',
    'sub'
  ])
})

it('is valid for the lifetime asked for', async () => {
  const reply = await issue({ ...input, lifetime: 600 }, context)

  assert.ok(!(reply instanceof Error))
  assert.ok(Math.abs(reply.exp - Date.now() / 1000 - 600) < 5)
})

it('refuses a lifetime over the limit', async () => {
  assert.deepEqual(
    await issue({ ...input, lifetime: 601 }, context),
    new Error('LIFETIME')
  )
})

it('issues nothing without keys', async () => {
  context.configuration.keys = []

  assert.deepEqual(await issue(input, context), new Error('NOT_ISSUER'))
})

it('issues nothing for an authority the annotation does not map', async () => {
  assert.deepEqual(
    await issue({ ...input, authority: 'constructor' }, context),
    new Error('NOT_ISSUER')
  )
})

it('publishes no private part', async () => {
  const { keys: published } = await keys(null, context)

  assert.deepEqual(
    published.map((jwk) => jwk.kid),
    ['k2', 'k1']
  )

  for (const jwk of published) assert.equal(jwk.d, undefined)
})

const pems = new Map<string, string>()

function key(kid: string): { kid: string; key: { unwrap: () => string } } {
  if (!pems.has(kid))
    pems.set(
      kid,
      generateKeyPairSync('ec', { namedCurve: 'P-256' })
        .privateKey.export({ format: 'pem', type: 'pkcs8' })
        .toString()
    )

  return { kid, key: { unwrap: () => pems.get(kid)! } }
}

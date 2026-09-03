import { it, mock } from 'node:test'
import type { Mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { createRemoteJWKSet, discover } from './discovery.js'
import { load } from './jose.js'
import type { Fetch } from '../types/context.js'

it('discovers an issuer using the component fetch', async () => {
  const iss = `https://${Math.random().toString(36).slice(2)}.example.com`
  const configuration = { issuer: iss, jwks_uri: `${iss}/jwks` }

  const fetch = mock.fn(async (_input: string | URL | Request) =>
    Response.json(configuration)) as Mock<Fetch>

  await assert.partialDeepStrictEqual(await discover(iss, fetch), configuration)
  assert.ok(fetch.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], `${iss}/.well-known/openid-configuration`)))
})

it('loads and caches remote keys using the component fetch', async () => {
  const jose = await load()
  const iss = `https://${Math.random().toString(36).slice(2)}.example.com`
  const jwksUri = `${iss}/jwks`
  const { privateKey, publicKey } = await jose.generateKeyPair('ES256')
  const jwk = await jose.exportJWK(publicKey)

  const fetch = mock.fn(async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString()

    if (url.endsWith('/.well-known/openid-configuration'))
      return Response.json({ issuer: iss, jwks_uri: jwksUri })

    return Response.json({ keys: [{ ...jwk, alg: 'ES256', kid: 'key0', use: 'sig' }] })
  }) as Mock<Fetch>

  const token = await new jose.SignJWT({ sub: 'subject' })
    .setProtectedHeader({ alg: 'ES256', kid: 'key0' })
    .setIssuer(iss)
    .sign(privateKey)

  const first = await createRemoteJWKSet(iss, fetch)
  const second = await createRemoteJWKSet(iss, fetch)

  assert.strictEqual(second, first)
  await assert.partialDeepStrictEqual(await jose.jwtVerify(token, first, { issuer: iss }), {
    payload: { sub: 'subject' }
  })
  assert.strictEqual(fetch.mock.callCount(), 2)
})

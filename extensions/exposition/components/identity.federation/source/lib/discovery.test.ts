import { createRemoteJWKSet, discover } from './discovery'
import { load } from './jose'
import type { Fetch } from '../types/context'

it('discovers an issuer using the component fetch', async () => {
  const iss = `https://${Math.random().toString(36).slice(2)}.example.com`
  const configuration = { issuer: iss, jwks_uri: `${iss}/jwks` }

  const fetch = jest.fn(async (_input: string | URL | Request) =>
    Response.json(configuration)) as jest.MockedFunction<Fetch>

  await expect(discover(iss, fetch)).resolves.toMatchObject(configuration)
  expect(fetch).toHaveBeenCalledWith(`${iss}/.well-known/openid-configuration`)
})

it('loads and caches remote keys using the component fetch', async () => {
  const jose = await load()
  const iss = `https://${Math.random().toString(36).slice(2)}.example.com`
  const jwksUri = `${iss}/jwks`
  const { privateKey, publicKey } = await jose.generateKeyPair('ES256')
  const jwk = await jose.exportJWK(publicKey)

  const fetch = jest.fn(async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString()

    if (url.endsWith('/.well-known/openid-configuration'))
      return Response.json({ issuer: iss, jwks_uri: jwksUri })

    return Response.json({ keys: [{ ...jwk, alg: 'ES256', kid: 'key0', use: 'sig' }] })
  }) as jest.MockedFunction<Fetch>

  const token = await new jose.SignJWT({ sub: 'subject' })
    .setProtectedHeader({ alg: 'ES256', kid: 'key0' })
    .setIssuer(iss)
    .sign(privateKey)

  const first = await createRemoteJWKSet(iss, fetch)
  const second = await createRemoteJWKSet(iss, fetch)

  expect(second).toBe(first)
  await expect(jose.jwtVerify(token, first, { issuer: iss })).resolves.toMatchObject({
    payload: { sub: 'subject' }
  })
  expect(fetch).toHaveBeenCalledTimes(2)
})

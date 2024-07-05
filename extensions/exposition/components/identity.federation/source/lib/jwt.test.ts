import * as http from 'node:http'

/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { once } from 'node:events'
import { validateSignature, decodeJwt, validateJwtPayload, cachedFetch } from './jwt'
import type { AddressInfo } from 'node:net'
import type { IdToken, JwtHeader, Trust } from '../types'

describe('jwt', () => {
  describe('validateJwtPayload', () => {
    const jwtHeader: JwtHeader = { alg: 'HS256', kid: 'k1' }

    const trusted: Trust[] = [{
      iss: 'test-iss',
      aud: ['test-aud1', 'test-aud2'],
      secrets: { [jwtHeader.alg]: { [jwtHeader.kid!]: 'test-secrete' } }
    }]

    const validJwtPayload: IdToken = {
      iss: trusted[0].iss,
      sub: 'test-sub',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 2000,
      aud: trusted[0].aud![1]
    }

    describe('aud', () => {
      test('throws without it', () => {
        const { aud, ...noAudPayload } = validJwtPayload

        expect(() => validateJwtPayload(noAudPayload, trusted, jwtHeader)).toThrow('Payload is missing aud')
      })

      test('passes with a single string', () => {
        expect(validJwtPayload.aud).toEqual(expect.any(String))
        expect(() => validateJwtPayload(validJwtPayload, trusted, jwtHeader)).not.toThrow()
      })

      test('passes with an array', () => {
        const arrayAudPayload = { ...validJwtPayload, aud: trusted[0].aud }

        expect(arrayAudPayload.aud).toEqual(expect.any(Array))
        expect(() => validateJwtPayload(arrayAudPayload, trusted, jwtHeader)).not.toThrow()
      })

      test('throws with an array that does not intersects', () => {
        const arrayAudPayload = { ...validJwtPayload, aud: ['boo', 'foo'] }

        expect(arrayAudPayload.aud).toEqual(expect.any(Array))
        expect(() => validateJwtPayload(arrayAudPayload, trusted, jwtHeader))
          .toThrow('Unknown audiences: boo, foo')
      })
    })
  })

  test('decode', () => {
    const { header, payload } = decodeJwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzb21lIjoicGF5bG9hZCJ9.4twFt5NiznN84AWoo1d7KO1T_yoc0Z6XOpOVswacPZg')

    expect(header).toMatchObject({ alg: 'HS256' })
    expect(payload).toEqual({ some: 'payload' })
  })

  test('symmetric pass', async () => {
    // example from
    // https://pyjwt.readthedocs.io/en/latest/usage.html#encoding-decoding-tokens-with-hs256

    await expect(validateSignature({
      header: { alg: 'HS256', kid: 'k2' },
      payload: { iss: 'test-issuer', aud: 'test', sub: '0', exp: 0, iat: 0 },
      rawHeader: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      rawPayload: 'eyJzb21lIjoicGF5bG9hZCJ9',
      signature: '4twFt5NiznN84AWoo1d7KO1T_yoc0Z6XOpOVswacPZg',
      trusted: [
        {
          iss: 'test-issuer',
          secrets: {
            HS256: {
              k1: 'old-secret',
              k2: 'secret'
            }
          }
        }
      ]
    } as Parameters<typeof validateSignature>[0])).resolves.toBeUndefined()
  })

  test('symmetric fail', async () => {
    await expect(validateSignature({
      header: { alg: 'HS256' },
      payload: { iss: 'test-issuer', aud: 'test', sub: '0', exp: 0, iat: 0 },
      rawHeader: 'header',
      rawPayload: 'payload',
      signature: 'signature',
      trusted: [
        {
          iss: 'test-issuer',
          secrets: {
            HS256: {
              theKey: 'secret'
            }
          }
        }
      ]
    } as Parameters<typeof validateSignature>[0])).rejects.toThrow('Signature does not match')
  })

  describe.skip('cachedFetch', () => {
    let server: http.Server
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const handler = jest.fn<void, [http.IncomingMessage, http.ServerResponse]>()
    let endpoint: string

    beforeAll(async () => {
      server = http.createServer(handler)

      server.listen(0, 'localhost')
      await once(server, 'listening')

      const { address, port } = server.address() as AddressInfo

      endpoint = `http://${address}:${port}`
    })

    afterEach(() => {
      handler.mockReset()
    })

    afterAll(async () => {
      server.close()
      await once(server, 'close')
    })

    test('fetches only once', async () => {
      handler.mockImplementationOnce((req, res) => {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' })
        res.end(JSON.stringify({ foo: 'bar' }))
      }).mockImplementationOnce((req, res) => {
        res.writeHead(500)
        res.end()
      })

      const firstRequest = await cachedFetch(endpoint)

      expect(firstRequest.ok).toBe(true)
      await expect(firstRequest.json()).resolves.toEqual({ foo: 'bar' })

      const secondRequest = await cachedFetch(endpoint)

      expect(secondRequest.ok).toBe(true)
      await expect(secondRequest.json()).resolves.toEqual({ foo: 'bar' })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    test('respects caching headers', async () => {
      handler.mockImplementation((req, res) => {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' })
        res.end(JSON.stringify({ foo: 'bar' }))
      })

      const firstRequest = await cachedFetch(endpoint + '/no-cache')

      expect(firstRequest.headers.get('cache-control')).toBe('no-cache')
      expect(firstRequest.ok).toBe(true)
      await expect(firstRequest.json()).resolves.toEqual({ foo: 'bar' })

      const secondRequest = await cachedFetch(endpoint + '/no-cache')

      expect(secondRequest.ok).toBe(true)
      await expect(secondRequest.json()).resolves.toEqual({ foo: 'bar' })

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })
})

/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { validateSignature, decodeJwt, validateJwtPayload } from './jwt'
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
})

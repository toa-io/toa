import * as jose from 'jose'
import { Err } from 'error-value'
import { createRemoteJWKSet } from './discovery'
import type { Stash } from '@toa.io/types'
import type { Trust } from '../types'

const jwks: Record<string, Awaited<ReturnType<typeof createRemoteJWKSet>>> = {}

export async function decode (token: string, trust: Trust[], stash: Stash): Promise<Payload | Error> {
  const { iss, sub } = jose.decodeJwt(token)

  if (typeof iss !== 'string')
    return ERR_ISS

  if (typeof sub !== 'string')
    return ERR_SUB

  const trusted = trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return ERR_TRUST

  jwks[iss] ??= await createRemoteJWKSet(iss)

  const { payload } = await jose.jwtVerify(token, jwks[iss], { audience: trusted.aud })

  if (payload.jti !== undefined) {
    const error = await validateJti(payload, stash)

    if (error instanceof Error)
      return error
  }

  return payload as Payload
}

async function validateJti (payload: jose.JWTPayload, stash: Stash): Promise<void | Error> {
  if (payload.exp === undefined)
    return ERR_EXP

  const ttl = payload.exp - Math.floor(Date.now() / 1000)
  const key = `identity:federation:jti:${payload.jti}`
  const ok = await stash.set(key, 1, 'EX', ttl, 'NX') // set if not exists

  if (ok === null)
    return ERR_REPLAY
}

const ERR_ISS = new Err('ISS', 'Invalid issuer')
const ERR_SUB = new Err('SUB', 'Invalid subject')
const ERR_EXP = new Err('EXP', 'Token does not have an expiration time')
const ERR_TRUST = new Err('TRUST', 'Issuer not trusted')
const ERR_REPLAY = new Err('REPLAY', 'Token has already been used')

export interface Payload extends jose.JWTPayload {
  iss: string
  sub: string
}

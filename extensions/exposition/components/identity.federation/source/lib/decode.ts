import * as jose from 'jose'
import { createRemoteJWKSet } from './discovery'
import { ERR_TRUST, ERR_ISS, ERR_SUB, ERR_REPLAY, ERR_EXP } from './errors'
import type { Stash } from '@toa.io/types'
import type { Ctx } from './Ctx'
import type { Payload } from './Payload'

const jwks: Record<string, Awaited<ReturnType<typeof createRemoteJWKSet>>> = {}

export async function decode (token: string, ctx: Ctx): Promise<Payload | Error> {
  const { iss, sub } = jose.decodeJwt(token)

  if (typeof iss !== 'string')
    return ERR_ISS

  if (typeof sub !== 'string')
    return ERR_SUB

  const trusted = ctx.trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return ERR_TRUST

  jwks[iss] ??= await createRemoteJWKSet(iss)

  const { payload } = await jose.jwtVerify(token, jwks[iss], { audience: trusted.aud })

  if (payload.jti !== undefined) {
    const error = await validateJti(payload, ctx.stash)

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

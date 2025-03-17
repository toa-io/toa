import * as jose from 'jose'
import { createRemoteJWKSet } from './discovery'
import { ERR_TRUST, ERR_ISS, ERR_SUB } from './errors'
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

  return payload as Payload
}

import { load } from './jose'
import { createRemoteJWKSet } from './discovery'
import { ERR_TRUST, ERR_ISS, ERR_SUB } from './errors'
import type { Ctx } from './Ctx'
import type { Payload } from './Payload'

export async function decode (token: string, ctx: Ctx): Promise<Payload | Error> {
  const jose = await load()
  const { iss, sub } = jose.decodeJwt(token)

  if (typeof iss !== 'string')
    return ERR_ISS

  if (typeof sub !== 'string')
    return ERR_SUB

  const trusted = ctx.trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return ERR_TRUST

  const jwks = await createRemoteJWKSet(iss, ctx.fetch)

  const { payload } = await jose.jwtVerify(token, jwks, { audience: trusted.aud })

  return payload as Payload
}

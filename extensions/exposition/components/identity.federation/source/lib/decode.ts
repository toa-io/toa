import { load } from './jose.js'
import { createRemoteJWKSet } from './discovery.js'
import { ERR_TRUST, ERR_ISS, ERR_SUB, ERR_TOKEN } from './errors.js'
import type { JWTPayload } from 'jose'
import type { Ctx } from './Ctx.js'
import type { Payload } from './Payload.js'

export async function decode (token: string, ctx: Ctx): Promise<Payload | Error> {
  const jose = await load()

  let claims: JWTPayload

  // jose throws on anything it cannot read, and credentials are the client's to malform
  try {
    claims = jose.decodeJwt(token)
  } catch {
    return ERR_TOKEN
  }

  const { iss, sub } = claims

  if (typeof iss !== 'string')
    return ERR_ISS

  if (typeof sub !== 'string')
    return ERR_SUB

  const trusted = ctx.trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return ERR_TRUST

  // the issuer is a configured one by now, so reaching its keys is the deployment's to answer for
  const jwks = await createRemoteJWKSet(iss, ctx.fetch)

  try {
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: iss,
      audience: trusted.aud,
      requiredClaims: ['exp']
    })

    return payload as Payload
  } catch {
    return ERR_TOKEN
  }
}

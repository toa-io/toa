import { randomUUID } from 'node:crypto'
import { load } from './lib/jose.js'
import { issuer } from './lib/issuer.ts'
import { ALG, signer } from './lib/keys.ts'
import type { Context } from './types/index.ts'

export async function computation(
  input: Input,
  context: Context
): Promise<Output | Error> {
  const { keys, lifetime: limit } = context.configuration
  const iss = issuer(input.authority)
  const key = keys[0]

  if (iss === undefined || key === undefined) return ERR_NOT_ISSUER

  const lifetime = input.lifetime ?? LIFETIME

  if (lifetime > limit) return ERR_LIFETIME

  const jose = await load()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + lifetime

  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: ALG, kid: key.kid, typ: 'JWT' })
    .setIssuer(iss)
    .setSubject(input.sub)
    .setAudience(input.audience)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(randomUUID())
    .sign(await signer(key))

  context.logs.debug('Token issued', { iss, sub: input.sub, aud: input.audience, exp })

  return { token, exp }
}

/** Seconds: a token is asked for to make a call, not to be kept. */
const LIFETIME = 300

const ERR_NOT_ISSUER = new Error('NOT_ISSUER')
const ERR_LIFETIME = new Error('LIFETIME')

interface Input {
  authority: string
  sub: string
  audience: string
  lifetime?: number
}

interface Output {
  token: string
  exp: number
}

import { load } from './jose'
import { createRemoteJWKSet, discover } from './discovery'
import * as errors from './errors'
import type { Trust } from '../types'
import type { Ctx } from './Ctx'
import type { Payload } from './Payload'

export async function exchange (credentials: string, ctx: Ctx): Promise<Payload | Error> {
  const jose = await load()
  const properties = decode(credentials)

  if (properties instanceof Error)
    return properties

  const { code, iss, for: redirect } = properties

  const trusted = ctx.trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return errors.ERR_TRUST

  if (trusted.aud === undefined || (trusted.secret === undefined && trusted.signature === undefined))
    return errors.ERR_CODE_NOT_ENABLED

  const configuration = await discover(iss, ctx.fetch)

  if (configuration.token_endpoint === undefined)
    return errors.ERR_CONFIG

  // array actually is not expected here, but it is a valid format
  const aud = Array.isArray(trusted.aud) ? trusted.aud[0] : trusted.aud
  const secret = trusted.secret ?? await sign(trusted)
  const params = new URLSearchParams()

  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('client_id', aud)
  params.append('client_secret', secret)
  params.append('redirect_uri', redirect)

  ctx.logs.debug('Exchanging code', {
    iss,
    aud,
    for: redirect,
    auth: trusted.secret === undefined ? 'signature' : 'secret',
    code
  })

  const response = await ctx.fetch(configuration.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })

  if (!response.ok) {
    ctx.logs.error('Code exchange failed', { status: response.status, text: await response.text() })

    return errors.ERR_RESPONSE
  }

  const tokens = await response.json() as { id_token: string }

  if (tokens.id_token === undefined)
    return errors.ERR_NO_TOKEN

  const jwks = await createRemoteJWKSet(iss, ctx.fetch)

  const { payload } = await jose.jwtVerify(tokens.id_token, jwks, {
    audience: trusted.aud,
    issuer: iss
  })

  return payload as Payload
}

function decode (credentials: string): Properties | Error {
  const json = Buffer.from(credentials, 'base64').toString('utf8')
  const properties = JSON.parse(json) as Properties

  if (
    typeof properties.code !== 'string' ||
    typeof properties.iss !== 'string' ||
    typeof properties.for !== 'string' ||
    Object.keys(properties).length !== CREDENTIAL_PROPERTIES.length
  )
    return errors.ERR_CODE_SCHEMA

  return properties
}

async function sign (trust: Trust): Promise<string> {
  const jose = await load()
  const signature = trust.signature!
  const aud = Array.isArray(trust.aud) ? trust.aud[0] : trust.aud!
  const now = Math.floor(Date.now() / 1000)
  const key = await jose.importPKCS8(atob(signature.key), 'ES256')

  return await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: signature.kid })
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setIssuer(signature.iss)
    .setSubject(aud)
    .setAudience(trust.iss)
    .sign(key)
}

const CREDENTIAL_PROPERTIES: Array<keyof Properties> = ['for', 'iss', 'code']

interface Properties {
  code: string
  iss: string
  for: string
}

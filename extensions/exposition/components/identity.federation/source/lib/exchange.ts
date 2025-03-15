import * as jose from 'jose'
import { createRemoteJWKSet, discover } from './discovery'
import * as errors from './errors'
import type { Payload } from './Payload'
import type { Trust } from '../types'

const jwks: Record<string, Awaited<ReturnType<typeof createRemoteJWKSet>>> = {}

export async function exchange (credentials: string, trust: Trust[]): Promise<Payload | Error> {
  const properties = parse(credentials)

  if (properties instanceof Error)
    return properties

  const { code, iss, for: redirect } = properties

  const trusted = trust.find((trust) => trust.iss === iss)

  if (trusted === undefined)
    return errors.ERR_TRUST

  if (trusted.aud === undefined || trusted.secret === undefined)
    return errors.ERR_CODE_NOT_SUPPORTED

  const configuration = await discover(iss)

  if (configuration.token_endpoint === undefined)
    return errors.ERR_CONFIG

  const aud = Array.isArray(trusted.aud) ? trusted.aud[0] : trusted.aud
  const params = new URLSearchParams()

  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('client_id', aud)
  params.append('client_secret', trusted.secret)
  params.append('redirect_uri', redirect)

  const response = await fetch(configuration.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })

  if (!response.ok)
    return errors.ERR_RESPONSE

  const tokens = await response.json() as { id_token: string }

  if (tokens.id_token === undefined)
    return errors.ERR_NO_TOKEN

  jwks[iss] ??= await createRemoteJWKSet(iss)

  const { payload } = await jose.jwtVerify(tokens.id_token, jwks[iss], {
    audience: trusted.aud,
    issuer: iss
  })

  return payload as Payload
}

// Credentials format is "code=<code>, iss=<iss>, redirect=<redirect>"
function parse (credentials: string): Properties | Error {
  const properties: Partial<Properties> = {}

  for (const pair of credentials.split(',')) {
    const [key, value] = pair.trim().split('=') as [keyof Properties, string]

    if (!CREDENTIAL_PROPERTIES.includes(key))
      return errors.ERR_CODE_PARAMETERS

    properties[key] = value
  }

  if (Object.keys(properties).length !== CREDENTIAL_PROPERTIES.length)
    return errors.ERR_CODE_PARAMETERS

  return properties as Properties
}

const CREDENTIAL_PROPERTIES: Array<keyof Properties> = ['for', 'iss', 'code']

interface Properties {
  code: string
  iss: string
  for: string
}

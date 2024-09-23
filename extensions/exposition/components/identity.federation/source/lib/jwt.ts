import crypto from 'node:crypto'
import * as assert from 'node:assert'
import { get } from './get'
import type { JwtHeader, IdToken, Trust } from '../types'

export function decodeJwt (token: string): {
  header: unknown
  payload: unknown
  rawHeader: string
  rawPayload: string
  signature: string
} {
  const [rawHeader, rawPayload, signature] = token.split('.', 3)

  const header = JSON.parse(Buffer.from(rawHeader, 'base64url').toString())
  const payload = JSON.parse(Buffer.from(rawPayload, 'base64url').toString())

  return { header, payload, rawHeader, rawPayload, signature }
}

export function validateJwtHeader (header: unknown): asserts header is JwtHeader {
  assert.ok(header !== null && typeof header === 'object', 'Header is not an object')
  assert.ok('alg' in header, 'Header is missing alg')
  assert.ok(typeof header.alg === 'string', 'Header alg is not a string')
  assert.match(header.alg, /^RS256|HS\d{3}$/, `Unknown algorithm ${header.alg}`)
  assert.ok(!('kid' in header) || typeof header.kid === 'string', 'kid must be a string if present')
}

export function validateJwtPayload (payload: unknown,
  trusted: Trust[] = [],
  header: JwtHeader): asserts payload is IdToken {
  assert.ok(trusted.length > 0, 'No trusted issuers provided')

  // the full list of validations is
  // at https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
  assert.ok(payload !== null && typeof payload === 'object', 'Payload is not an object')

  assert.ok('iss' in payload, 'Payload is missing iss')
  assert.ok(typeof payload.iss === 'string', 'Payload iss is not a string')
  assert.ok('aud' in payload, 'Payload is missing aud')
  assert.ok(typeof payload.aud === 'string' ||
    (Array.isArray(payload.aud) && payload.aud.every((e): e is string => typeof e === 'string')),
  'Payload aud is not a string nor an array of strings')

  const issuer = trusted.find((config) => config.iss === payload.iss)

  assert.ok(issuer, `Unknown issuer: ${payload.iss}`)

  if (Array.isArray(issuer.aud)) {
    const tokenAud = payload.aud

    if (typeof tokenAud === 'string')
      assert.ok(issuer.aud.some((a) => a === tokenAud), `Unknown audience: ${tokenAud}`)
    else
      assert.ok(issuer.aud.some((a) => tokenAud.includes(a)), `Unknown audiences: ${tokenAud.join(', ')}`)
  }

  if (header.alg.startsWith('HS')) {
    const secrets = issuer.secrets

    assert.ok(secrets, `We don't have known secrets for ${payload.iss}`)

    const keys = secrets[header.alg]

    assert.ok(keys, `No known secrets for ${header.alg}`)

    if (typeof header.kid === 'string')
      assert.ok(header.kid in keys, `No secret ${header.kid} provided for ${header.alg}`)
  }

  assert.ok('sub' in payload, 'Payload is missing sub')
  assert.ok(typeof payload.sub === 'string', 'Payload sub is not a string')

  assert.ok('exp' in payload, 'Payload is missing exp')
  assert.ok(typeof payload.exp === 'number', 'Payload exp is not a number')
  assert.ok(Date.now() < payload.exp * 1000, 'Token is expired')

  assert.ok('iat' in payload, 'Payload is missing iat')
  assert.ok(typeof payload.iat === 'number', 'Payload iat is not a number')
  assert.ok(Date.now() >= payload.iat * 1000, 'Token was issued in the future')
  assert.ok(payload.exp >= payload.iat, 'Payload exp is before iat')

  if ('nbf' in payload) {
    assert.ok(typeof payload.nbf === 'number', 'Payload nbf is not a number')
    assert.ok(Date.now() >= payload.nbf * 1000, 'Token is not valid yet')
  }
}

export async function validateSignature ({
  header: { kid, alg },
  payload: { iss },
  rawHeader,
  rawPayload,
  signature,
  trusted = []
}: {
  readonly header: JwtHeader
  rawHeader: string
  readonly payload: IdToken
  rawPayload: string
  signature: string
  trusted?: Trust[]
}): Promise<void> {
  if (alg.startsWith('HS')) {
    // symmetric algorithm, issuer is validated at this point

    const secrets = trusted.find((c) => c.iss === iss)!.secrets![alg]
    const secret = kid !== undefined ? secrets[kid] : Object.values(secrets)[0]
    const algorithm = alg.replace(/^HS(\d{3})$/, 'sha$1') // HS256 -> sha256
    const hmac = crypto.createHmac(algorithm, secret)

    hmac.update(rawHeader)
    hmac.update('.')
    hmac.update(rawPayload)
    assert.strictEqual(signature, hmac.digest('base64url'), 'Signature does not match')

    return
  }

  // Getting issuer public keys
  const oidcRequest = await get(new URL('/.well-known/openid-configuration', iss).href)

  assert.ok(oidcRequest.ok,
    `Failed to fetch OpenID configuration: ${oidcRequest.statusText}`)

  const { jwks_uri: jwksUri } = (await oidcRequest.json()) as { jwks_uri: string }

  const jwkRequest = await get(jwksUri)

  assert.ok(jwkRequest.ok, `Failed to fetch issuer keys: ${jwkRequest.statusText}`)

  const { keys } = (await jwkRequest.json()) as {
    keys: Array<{ use: string, kid?: string, alg?: string } & crypto.JsonWebKey>
  }

  // getting corresponding signing key
  const signingKeys = keys.filter((k) => k.use === 'sig' && k.alg === alg)

  assert.ok(signingKeys.length > 0, 'No acceptable signing keys found')

  assert.ok(kid !== undefined || signingKeys.length === 1,
    'Signing key selection is not deterministic')

  const signingKey = kid === undefined ? signingKeys.find((k) => k.kid === kid) : keys[0]

  assert.ok(signingKey, 'Signing key was not found in issuer keys')

  const verifyFunction = crypto.createVerify('RSA-SHA256')

  verifyFunction.write(rawHeader)
  verifyFunction.write('.')
  verifyFunction.write(rawPayload)
  verifyFunction.end()

  const signatureValid = verifyFunction.verify({ format: 'jwk', key: signingKey },
    signature,
    'base64url')

  assert.ok(signatureValid, 'Failed to validate signature')
}

export async function decode (token: string, trusted?: Trust[]): Promise<IdToken> {
  const { header, payload, rawHeader, rawPayload, signature } = decodeJwt(token)

  validateJwtHeader(header)
  validateJwtPayload(payload, trusted, header)

  await validateSignature({
    header,
    rawHeader,
    payload,
    rawPayload,
    signature,
    trusted
  })

  return payload
}

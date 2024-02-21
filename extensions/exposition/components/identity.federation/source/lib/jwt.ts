import crypto from 'node:crypto'
import * as assert from 'node:assert'
import { type JwtHeader, type IdToken, SupportedTokenAlg } from '../types'
import { type TrustConfiguration } from '../schemas'

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
  // assert.ok('typ' in header, 'Header is missing typ')
  // assert.ok(typeof header.typ === 'string', 'Header typ is not a string')
  // assert.equal(header.typ.toUpperCase(), 'JWT')
  assert.ok('alg' in header, 'Header is missing alg')
  assert.ok(typeof header.alg === 'string', 'Header alg is not a string')
  assert.ok(['RS256', 'HS256'].includes(header.alg),
    `Unsupported algorithm '${header.alg}'`)
}

export function validateJwtPayload (payload: unknown,
  trusted: TrustConfiguration[] = [],
  alg: SupportedTokenAlg): asserts payload is IdToken {
  assert.ok(trusted.length > 0, 'No trusted issuers provided')

  // full list of validations is
  // at https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
  assert.ok(payload !== null && typeof payload === 'object', 'Payload is not an object')

  assert.ok('iss' in payload, 'Payload is missing iss')
  assert.ok(typeof payload.iss === 'string', 'Payload iss is not a string')
  assert.ok('aud' in payload, 'Payload is missing aud')
  assert.ok(typeof payload.aud === 'string', 'Payload aud is not a string')

  const issuer = trusted.find((config) => config.issuer === payload.iss)

  assert.ok(issuer !== undefined &&
      (issuer.audience === undefined || issuer.audience.some((a) => a === payload.aud),
      `Unknown issuer / audience: ${payload.iss} / ${payload.aud}`))

  assert.ok(alg !== SupportedTokenAlg.HS256 || issuer.secret !== undefined,
    `Missing a secret for issuer ${payload.iss}`)

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
  trusted?: TrustConfiguration[]
}): Promise<void> {
  if (alg === SupportedTokenAlg.HS256) {
    // symmetric algorithm, issuer is validated at this point
    const { secret } = trusted.find((c) => c.issuer === iss) as { secret: string }
    const hmac = crypto.createHmac('sha256', secret)

    hmac.update(rawHeader)
    hmac.update('.')
    hmac.update(rawPayload)
    assert.strictEqual(signature, hmac.digest('base64url'), 'Signature does not match')

    return
  }

  // Getting issuer public keys
  const oidcRequest = await fetch(`${iss}/.well-known/openid-configuration`, {
    cache: 'default'
  })

  assert.ok(oidcRequest.ok,
    `Failed to fetch OpenID configuration: ${oidcRequest.statusText}`)

  const { jwks_uri: jwksUri } = (await oidcRequest.json()) as { jwks_uri: string }

  const jwkRequest = await fetch(jwksUri, { cache: 'default' })

  assert.ok(jwkRequest.ok, `Failed to fetch issuer keys: ${jwkRequest.statusText}`)

  const { keys } = (await jwkRequest.json()) as {
    keys: Array<{ use: string, kid?: string, alg?: string } & crypto.JsonWebKey>
  }

  // getting corresponding signing key
  const signingKeys = keys.filter((k) => k.use === 'sig' && k.alg === alg)

  assert.ok(signingKeys.length > 0, 'No acceptable signing keys found')

  assert.ok(kid === undefined || signingKeys.length === 1,
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

export async function validateIdToken (token: string,
  trusted?: TrustConfiguration[]): Promise<IdToken> {
  const { header, payload, rawHeader, rawPayload, signature } = decodeJwt(token)

  validateJwtHeader(header)
  validateJwtPayload(payload, trusted, header.alg)
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

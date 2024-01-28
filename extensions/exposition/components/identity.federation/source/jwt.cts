import crypto from 'node:crypto'
import assert from 'node:assert'
import type { JwtHeader, IdToken } from './types'

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
  assert.ok('typ' in header, 'Header is missing typ')
  assert.equal(header.typ, 'JWT')
  assert.ok('alg' in header, 'Header is missing alg')
  assert.ok(typeof header.alg === 'string', 'Header alg is not a string')
  assert.equal(header.alg, 'RS256', `We only validating RS256 id_tokens, but got ${header.alg}`)
}

export function validateJwtPayload (
  payload: unknown,
  {
    allowedIssuers,
    allowedAudiences
  }: {
    readonly allowedIssuers?: readonly string[]
    readonly allowedAudiences?: readonly string[]
  }
): asserts payload is IdToken {
  // full list of validations is at https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
  assert.ok(payload !== null && typeof payload === 'object', 'Payload is not an object')
  assert.ok('iss' in payload, 'Payload is missing iss')
  assert.ok(typeof payload.iss === 'string', 'Payload iss is not a string')

  if (allowedIssuers !== undefined) {
    assert.ok(allowedIssuers.includes(payload.iss), `Unknown issuer: ${payload.iss}`)
  }

  assert.ok('sub' in payload, 'Payload is missing sub')
  assert.ok(typeof payload.sub === 'string', 'Payload sub is not a string')

  assert.ok('aud' in payload, 'Payload is missing aud')
  assert.ok(typeof payload.aud === 'string', 'Payload aud is not a string')

  assert.ok(allowedAudiences?.includes(payload.aud) !== false, `Unknown audience: ${payload.aud}`)

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
  signature
}: {
  readonly header: JwtHeader
  rawHeader: string
  readonly payload: IdToken
  rawPayload: string
  signature: string
}): Promise<void> {
  // Getting issuer public keys
  const oidcRequest = await fetch(`${iss}/.well-known/openid-configuration`, {
    cache: 'default'
  })

  assert.ok(oidcRequest.ok, `Failed to fetch OpenID configuration: ${oidcRequest.statusText}`)

  const { jwks_uri: jwksUri } = (await oidcRequest.json()) as { jwks_uri: string }

  const jwkRequest = await fetch(jwksUri, { cache: 'default' })

  assert.ok(jwkRequest.ok, `Failed to fetch issuer keys: ${jwkRequest.statusText}`)

  const { keys } = (await jwkRequest.json()) as {
    keys: Array<{ use: string, kid?: string, alg?: string } & crypto.JsonWebKey>
  }

  // getting corresponding signing key
  const signingKeys = keys.filter((k) => k.use === 'sig' && k.alg === alg)

  assert.ok(signingKeys.length > 0, 'No acceptable signing keys found')

  assert.ok(
    kid === undefined || signingKeys.length === 1,
    'Signing key selection is not deterministic'
  )

  const signingKey = kid === undefined ? signingKeys.find((k) => k.kid === kid) : keys[0]

  assert.ok(signingKey, 'Signing key was not found in issuer keys')

  const verifyFunction = crypto.createVerify('RSA-SHA256')

  verifyFunction.write(rawHeader)
  verifyFunction.write('.')
  verifyFunction.write(rawPayload)
  verifyFunction.end()

  const signatureValid = verifyFunction.verify(
    { format: 'jwk', key: signingKey },
    signature,
    'base64url'
  )

  assert.ok(signatureValid, 'Failed to validate signature')
}

export async function validateIdToken (
  token: string,
  {
    allowedIssuers,
    allowedAudiences
  }: {
    readonly allowedIssuers?: readonly string[]
    readonly allowedAudiences?: readonly string[]
  }
): Promise<IdToken> {
  const { header, payload, rawHeader, rawPayload, signature } = decodeJwt(token)

  validateJwtHeader(header)
  validateJwtPayload(payload, { allowedIssuers, allowedAudiences })
  await validateSignature({
    header,
    rawHeader,
    payload,
    rawPayload,
    signature
  })

  return payload
}

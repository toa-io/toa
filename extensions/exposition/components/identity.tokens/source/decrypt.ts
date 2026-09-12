import { createDecipheriv } from 'node:crypto'
import { DecryptFactory, ImportKeyFactory } from 'paseto/v3/local'
import { LRUCache } from 'lru-cache'
import { form, jweKey } from './lib/index.ts'
import type { Maybe } from '@toa.io/core/types'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Claims, DecryptOutput, JWEClaims } from './lib/index.ts'

export class Computation implements Operation {
  private readonly keys: Record<string, Key> = {}
  private readonly legacy: Record<string, Key> = {}
  private cache!: LRUCache<string, KeyEntry>
  private latest!: string
  private remote!: Context['remote']['identity']['keys']
  private logs!: Context['logs']

  public mount(context: Context): void {
    const latest = context.configuration.keys.find(({ format }) => format !== 'paseto')

    if (latest === undefined)
      throw new TypeError('At least one JWE key must be configured')

    this.latest = latest.id
    this.remote = context.remote.identity.keys
    this.cache = new LRUCache<string, KeyEntry>(context.configuration.cache)
    this.logs = context.logs

    for (const { id, key, format } of context.configuration.keys) {
      const branch = format === 'paseto' ? this.legacy : this.keys

      branch[id] = { key: key.unwrap() }
    }
  }

  public async execute(token: string): Promise<Maybe<DecryptOutput>> {
    if (form(token) === 'paseto') {
      const kid = this.pasetoKid(token)

      if (kid instanceof Error) return kid

      const key = await this.key(kid, true)

      if (key instanceof Error) return key

      const claims = await decryptPaseto(token, key.key)

      if (claims instanceof Error) return claims

      // a token of the form this component leaves behind is answered with a re-issue
      return this.answer(claims, key, true)
    }

    const jwe = parse(token)

    if (jwe instanceof Error) return jwe

    const key = await this.key(jwe.kid, false)

    if (key instanceof Error) return key

    const claims = open(jwe, key.key)

    if (claims instanceof Error) return claims

    return this.answer(
      claims,
      key,
      jwe.kid !== this.latest && key.identity === undefined
    )
  }

  private pasetoKid(token: string): Maybe<string> {
    const [, , , footer] = token.split('.')

    if (footer === undefined) return ERR_INVALID_TOKEN

    try {
      const json = Buffer.from(footer, 'base64url').toString('utf-8')
      const { kid } = JSON.parse(json)

      if (typeof kid !== 'string') return ERR_INVALID_TOKEN

      return kid
    } catch {
      return ERR_INVALID_TOKEN
    }
  }

  /** What both forms answer once their claims are open. */
  private answer(claims: Claims, key: Key, refresh: boolean): Maybe<DecryptOutput> {
    this.logs.debug('Token claims', claims)

    if (key.identity !== undefined && claims.identity.id !== key.identity)
      return ERR_FORGED_KEY

    if (key.revokedAt !== undefined) return ERR_REVOKED_KEY

    return {
      iss: claims.iss,
      iat: claims.iat,
      exp: claims.exp,
      identity: claims.identity,
      ...(claims.aud === undefined ? {} : { aud: claims.aud }),
      refresh,
      custom: key.identity !== undefined
    }
  }

  private async key(kid: string, legacy: boolean): Promise<Maybe<Key>> {
    const configured = legacy ? this.legacy : this.keys

    if (kid in configured) return configured[kid]

    if (!this.cache.has(kid)) {
      const value = await this.remote.observe({ query: { id: kid } })

      this.cache.set(kid, { value })
    }

    const entry = this.cache.get(kid)

    return entry?.value ?? ERR_INVALID_KEY
  }
}

async function decryptPaseto(token: string, key: string): Promise<Maybe<Claims>> {
  try {
    const secret = await importKey(key as `k3.local.${string}`)
    // paseto 3 read a token that never expires; these are tokens already in the wild
    const { claims } = await decryptLocal(secret, token, { allowNonExpiring: true })

    return claims as unknown as Claims
  } catch {
    return ERR_INVALID_TOKEN
  }
}

/**
 * The five parts of a compact JWE (RFC 7516), of the one form this component issues: `dir`, so
 * the encrypted key is empty, `A256GCM`, and a `kid` naming the key. A header that asks for
 * anything else — another algorithm, a critical extension, compression — is refused, as jose
 * refuses it.
 */
function parse(token: string): Maybe<JWE> {
  const parts = token.split('.')

  if (parts.length !== PARTS || parts[1] !== '') return ERR_INVALID_TOKEN

  const [header, , iv, ciphertext, tag] = parts

  let declared: Record<string, unknown>

  try {
    declared = JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'))
  } catch {
    return ERR_INVALID_TOKEN
  }

  if (
    declared === null ||
    typeof declared !== 'object' ||
    declared.alg !== 'dir' ||
    declared.enc !== 'A256GCM' ||
    declared.typ !== 'JWT' ||
    typeof declared.kid !== 'string' ||
    declared.crit !== undefined ||
    declared.zip !== undefined
  )
    return ERR_INVALID_TOKEN

  return {
    kid: declared.kid,
    // the header as it was written, which is what it was encrypted against
    aad: Buffer.from(header, 'ascii'),
    iv: Buffer.from(iv, 'base64url'),
    ciphertext: Buffer.from(ciphertext, 'base64url'),
    tag: Buffer.from(tag, 'base64url')
  }
}

/** The claims a token carries, where its tag holds and its times admit it. */
function open(jwe: JWE, key: string): Maybe<Claims> {
  if (jwe.iv.length !== IV || jwe.tag.length !== TAG) return ERR_INVALID_TOKEN

  let payload: JWEClaims

  try {
    const decipher = createDecipheriv('aes-256-gcm', jweKey(key), jwe.iv)

    decipher.setAAD(jwe.aad)
    decipher.setAuthTag(jwe.tag)

    payload = JSON.parse(
      Buffer.concat([decipher.update(jwe.ciphertext), decipher.final()]).toString('utf-8')
    )
  } catch {
    return ERR_INVALID_TOKEN
  }

  if (
    payload === null ||
    typeof payload !== 'object' ||
    typeof payload.iss !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.identity !== 'object' ||
    payload.identity === null
  )
    return ERR_INVALID_TOKEN

  const now = Date.now()

  if (payload.exp !== undefined && payload.exp * 1000 <= now) return ERR_INVALID_TOKEN

  if (payload.nbf !== undefined && payload.nbf * 1000 > now) return ERR_INVALID_TOKEN

  return {
    iss: payload.iss,
    iat: new Date(payload.iat * 1000).toISOString(),
    ...(payload.exp === undefined
      ? {}
      : { exp: new Date(payload.exp * 1000).toISOString() }),
    identity: payload.identity,
    ...(payload.aud === undefined ? {} : { aud: payload.aud })
  }
}

interface JWE {
  kid: string
  aad: Buffer
  iv: Buffer
  ciphertext: Buffer
  tag: Buffer
}

const PARTS = 5
const IV = 12
const TAG = 16

const importKey = ImportKeyFactory().run
const decryptLocal = DecryptFactory().run

interface Key {
  key: string
  identity?: string
  revokedAt?: number
}

interface KeyEntry {
  value: Key | null
}

const ERR_INVALID_TOKEN = new (class InvalidTokenError extends Error {
  public readonly code = 'INVALID_TOKEN'
})()

const ERR_INVALID_KEY = new (class InvalidKeyError extends Error {
  public readonly code = 'INVALID_KEY'
})()

const ERR_FORGED_KEY = new (class ForgedKeyError extends Error {
  public readonly code = 'FORGED_KEY'
})()

const ERR_REVOKED_KEY = new (class RevokedKeyError extends Error {
  public readonly code = 'REVOKED_KEY'
})()

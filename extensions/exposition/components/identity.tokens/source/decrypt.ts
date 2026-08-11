import { V3 } from 'paseto'
import { Err } from 'error-value'
import { LRUCache } from 'lru-cache'
import { jweKey } from './lib'
import { load } from './lib/jose'
import type { Maybe, Operation } from '@toa.io/types'
import type { Context, Claims, DecryptOutput, JWEClaims } from './lib'

export class Computation implements Operation {
  private readonly keys: Record<string, Key> = {}
  private readonly legacy: Record<string, Key> = {}
  private cache!: LRUCache<string, KeyEntry>
  private latest!: string
  private remote!: Context['remote']['identity']['keys']
  private logs!: Context['logs']

  public mount (context: Context): void {
    const latest = context.configuration.keys.find(({ format }) => format !== 'paseto')

    if (latest === undefined)
      throw new TypeError('At least one JWE key must be configured')

    this.latest = latest.id
    this.remote = context.remote.identity.keys
    this.cache = new LRUCache<string, KeyEntry>(context.configuration.cache)
    this.logs = context.logs

    for (const { id, key, format } of context.configuration.keys) {
      const branch = format === 'paseto' ? this.legacy : this.keys

      branch[id] = { key }
    }
  }

  public async execute (token: string): Promise<Maybe<DecryptOutput>> {
    const legacy = token.startsWith('v3.local.')
    const kid = legacy ? this.pasetoKid(token) : await this.jweKid(token)

    if (kid instanceof Error)
      return kid

    const key = await this.key(kid, legacy)

    if (key instanceof Error)
      return key

    const claims = legacy
      ? await decryptPaseto(token, key.key)
      : await decryptJWE(token, key.key)

    if (claims instanceof Error)
      return claims

    this.logs.debug('Token claims', claims)

    if (key.identity !== undefined && claims.identity.id !== key.identity)
      return ERR_FORGED_KEY

    return {
      iss: claims.iss,
      iat: claims.iat,
      exp: claims.exp,
      identity: claims.identity,
      refresh: legacy || (kid !== this.latest && key.identity === undefined)
    }
  }

  private pasetoKid (token: string): Maybe<string> {
    const [, , , footer] = token.split('.')

    if (footer === undefined)
      return ERR_INVALID_TOKEN

    try {
      const json = Buffer.from(footer, 'base64url').toString('utf-8')
      const { kid } = JSON.parse(json)

      if (typeof kid !== 'string')
        return ERR_INVALID_TOKEN

      return kid
    } catch {
      return ERR_INVALID_TOKEN
    }
  }

  private async jweKid (token: string): Promise<Maybe<string>> {
    try {
      const { decodeProtectedHeader } = await load()
      const header = decodeProtectedHeader(token)

      if (header.alg !== 'dir' || header.enc !== 'A256GCM' || header.typ !== 'JWT' ||
        typeof header.kid !== 'string')
        return ERR_INVALID_TOKEN

      return header.kid
    } catch {
      return ERR_INVALID_TOKEN
    }
  }

  private async key (kid: string, legacy: boolean): Promise<Maybe<Key>> {
    const configured = legacy ? this.legacy : this.keys

    if (kid in configured)
      return configured[kid]

    if (!this.cache.has(kid)) {
      const value = await this.remote.observe({ query: { id: kid } })

      this.cache.set(kid, { value })
    }

    const entry = this.cache.get(kid)

    return entry?.value ?? ERR_INVALID_KEY
  }
}

async function decryptPaseto (token: string, key: string): Promise<Maybe<Claims>> {
  try {
    return await V3.decrypt<Claims>(token, key)
  } catch {
    return ERR_INVALID_TOKEN
  }
}

async function decryptJWE (token: string, key: string): Promise<Maybe<Claims>> {
  try {
    const { jwtDecrypt } = await load()

    const { payload } = await jwtDecrypt<JWEClaims>(token, jweKey(key), {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM']
    })

    if (typeof payload.iss !== 'string' || typeof payload.iat !== 'number' ||
      typeof payload.identity !== 'object' || payload.identity === null)
      return ERR_INVALID_TOKEN

    if (payload.exp !== undefined && payload.exp * 1000 <= Date.now())
      return ERR_INVALID_TOKEN

    return {
      iss: payload.iss,
      iat: new Date(payload.iat * 1000).toISOString(),
      ...(payload.exp === undefined ? {} : { exp: new Date(payload.exp * 1000).toISOString() }),
      identity: payload.identity
    }
  } catch {
    return ERR_INVALID_TOKEN
  }
}

interface Key {
  key: string
  identity?: string
}

interface KeyEntry {
  value: Key | null
}

const ERR_INVALID_TOKEN = new Err('INVALID_TOKEN')
const ERR_INVALID_KEY = new Err('INVALID_KEY')
const ERR_FORGED_KEY = new Err('FORGED_KEY')

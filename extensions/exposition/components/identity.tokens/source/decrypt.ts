import { V3 } from 'paseto'
import { Err } from 'error-value'
import { LRUCache } from 'lru-cache'
import type { Maybe, Operation } from '@toa.io/types'
import type { Context, Claims, DecryptOutput } from './lib'

export class Computation implements Operation {
  private keys: Record<string, Key> = {}
  private cache!: LRUCache<string, KeyEntry>
  private latest!: string
  private remote!: Context['remote']['identity']['keys']

  public mount (context: Context): void {
    this.latest = Object.keys(context.configuration.keys)[0]
    this.remote = context.remote.identity.keys
    this.cache = new LRUCache<string, KeyEntry>(context.configuration.cache)

    for (const [kid, key] of Object.entries(context.configuration.keys))
      this.keys[kid] = { key }
  }

  public async execute (token: string): Promise<Maybe<DecryptOutput>> {
    const kid = this.kid(token)

    if (kid instanceof Error)
      return kid

    const key = await this.key(kid)

    if (key instanceof Error)
      return key

    const claims = await decrypt(token, key.key)

    if (claims instanceof Error)
      return claims

    if (key.identity !== undefined && claims.identity.id !== key.identity)
      return ERR_FORGED_KEY

    return {
      iss: claims.iss,
      iat: claims.iat,
      exp: claims.exp,
      identity: claims.identity,
      refresh: kid !== this.latest && key.identity === undefined
    }
  }

  private kid (token: string): Maybe<string> {
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

  private async key (kid: string): Promise<Maybe<Key>> {
    if (kid in this.keys)
      return this.keys[kid]

    if (!this.cache.has(kid)) {
      const value = await this.remote.observe({ query: { id: kid } })

      this.cache.set(kid, { value })
    }

    const entry = this.cache.get(kid)

    return entry?.value ?? ERR_INVALID_KEY
  }
}

async function decrypt (token: string, key: string): Promise<Maybe<Claims>> {
  try {
    return await V3.decrypt<Claims>(token, key)
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

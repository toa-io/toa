import type { Maybe } from '@toa.io/core'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Entity } from './lib/index.js'

/**
 * Taking back what was allowed. The token itself is not deleted — it is out in the world —
 * so what is revoked is the key it was issued under, which is what `identity.tokens` reads
 * it with. It stops being a token within `identity.tokens.cache.ttl`.
 */
export class Transition implements Operation {
  private keys!: Context['remote']['identity']['keys']

  public mount (context: Context): void {
    this.keys = context.remote.identity.keys
  }

  public async execute (input: Input, object: Entity): Promise<Maybe<void>> {
    // the id is a route parameter, so a grant of another identity is asked for by anyone
    // who guesses one; the authority and the identity are what say it is theirs
    if (object._version === 0 || object.authority !== input.authority ||
      object.identity !== input.identity)
      return ERR_NOT_FOUND

    if (object.kid !== undefined)
      await this.keys.disable({ query: { id: object.kid } })

    object.revokedAt = Date.now()
  }
}

const ERR_NOT_FOUND = new (class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND'
})()

interface Input {
  authority: string
  identity: string
}

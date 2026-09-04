import { createHash } from 'node:crypto'

/**
 * A user holds one grant per client, so the record is addressed by the three things that
 * say which: authorizing again replaces what is there rather than leaving another row, and
 * revoking has one thing to revoke.
 */
export function identify (authority: string, identity: string, client: string): string {
  return createHash('sha256')
    .update(JSON.stringify([authority, identity, client]))
    .digest('hex')
    .slice(0, LENGTH)
}

/** What the entity prototype accepts as an id. */
const LENGTH = 32

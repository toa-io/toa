import { createHash } from 'node:crypto'
import type { Metadata } from './Entity.js'

/**
 * The id of a registration: a hash of what it says, so identical metadata is one client
 * however many times it arrives. A client cannot remember that it registered here, and
 * registers again on every fresh connection; without this the registry only grows.
 *
 * Only what is honoured is hashed. A field this component ignores would otherwise mint a
 * client per release of whoever sends it, and the authority is in there because credentials
 * are scoped to one.
 */
export function identify (authority: string, metadata: Metadata): string {
  const canonical = JSON.stringify([
    authority,
    metadata.client_name ?? null,
    metadata.client_uri ?? null,
    metadata.logo_uri ?? null,
    metadata.scope ?? null,
    [...metadata.redirect_uris].sort()
  ])

  return createHash('sha256').update(canonical).digest('hex').slice(0, LENGTH)
}

/** What the entity prototype accepts as an id. */
const LENGTH = 32

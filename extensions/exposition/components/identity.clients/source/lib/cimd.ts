import { createHash } from 'node:crypto'
import { ERR_UNKNOWN_CLIENT } from './errors.js'
import type { Context } from './Context.js'
import type { Client, Metadata } from './Entity.js'

/**
 * A Client ID Metadata Document: the client publishes what it is at an https URL, and that
 * URL is its `client_id`. Control of the origin is what proves the identity, so nothing is
 * registered and nothing is written — the document is read and held for a while.
 */
export async function read (id: string, context: Context): Promise<Client | Error> {
  // before anything is fetched: the id is the caller's to choose, and this runs inside
  // the cluster. An origin the configuration does not name is not reached at all.
  if (!trusted(id, context.configuration.trust))
    return ERR_UNKNOWN_CLIENT

  const key = CACHE + createHash('sha256').update(id).digest('hex')
  const cached = await context.stash.get(key)

  if (cached !== null)
    return cached === MISS ? ERR_UNKNOWN_CLIENT : JSON.parse(cached) as Client

  const client = await fetch(id, context)

  // a document that does not answer is remembered too, or a bad id is fetched per request
  await context.stash.set(key, client instanceof Error ? MISS : JSON.stringify(client),
    'EX', context.configuration.lifetime)

  return client
}

/**
 * An https URL whose origin the configuration names. Compared by origin so that a path on a
 * trusted host cannot be escaped by one that merely starts the same way.
 */
function trusted (id: string, trust: string[]): boolean {
  let url: URL

  try {
    url = new URL(id)
  } catch {
    return false
  }

  if (url.protocol !== 'https:')
    return false

  return trust.some((origin) => {
    try {
      return new URL(origin).origin === url.origin
    } catch {
      return false
    }
  })
}

async function fetch (id: string, context: Context): Promise<Client | Error> {
  const { size, timeout } = context.configuration

  try {
    const response = await context.fetch(id, {
      redirect: 'error', // a redirect leaves the origin that was trusted
      signal: AbortSignal.timeout(timeout),
      headers: { accept: 'application/json' }
    })

    if (!response.ok)
      return ERR_UNKNOWN_CLIENT

    const text = await response.text()

    if (text.length > size)
      return ERR_UNKNOWN_CLIENT

    return validate(id, JSON.parse(text) as Metadata & { client_id?: string })
  } catch (error: unknown) {
    context.logs.debug('Client metadata document is unreadable', {
      client: id,
      error: error?.toString?.()
    })

    return ERR_UNKNOWN_CLIENT
  }
}

function validate (id: string, metadata: Metadata & { client_id?: string }): Client | Error {
  // the document names itself, so one client's cannot claim another's identity
  if (metadata.client_id !== id)
    return ERR_UNKNOWN_CLIENT

  if (!Array.isArray(metadata.redirect_uris) || metadata.redirect_uris.length === 0 ||
    metadata.redirect_uris.some((uri) => typeof uri !== 'string'))
    return ERR_UNKNOWN_CLIENT

  return {
    client_id: id,
    client_name: metadata.client_name,
    client_uri: metadata.client_uri,
    logo_uri: metadata.logo_uri,
    redirect_uris: metadata.redirect_uris
  }
}

const CACHE = 'cimd:'

/** Held in place of a document that could not be read, so a bad id is not refetched. */
const MISS = ''

import { load } from './jose'
import type * as jose from 'jose'
import type { Configuration } from './Configuration'
import type { Fetch } from '../types/context'

const cache = new Map<string, Configuration>()
const resolvers = new WeakMap<Fetch, Map<string, Promise<jose.RemoteJWKSet>>>()

export async function discover (iss: string, fetch: Fetch): Promise<Configuration> {
  if (!cache.has(iss)) {
    const configuration = await fetchConfiguration(iss, fetch)

    cache.set(iss, configuration)
  }

  return cache.get(iss)!
}

async function fetchConfiguration (iss: string, fetch: Fetch): Promise<Configuration> {
  const response = await fetch(`${iss}/.well-known/openid-configuration`)

  if (!response.ok)
    throw new Error('Failed to fetch OIDC configuration')

  return await response.json() as Configuration
}

export async function createRemoteJWKSet (iss: string, fetch: Fetch): Promise<jose.RemoteJWKSet> {
  let entries = resolvers.get(fetch)

  if (entries === undefined) {
    entries = new Map()
    resolvers.set(fetch, entries)
  }

  if (!entries.has(iss))
    entries.set(iss, create(iss, fetch))

  return await entries.get(iss)!
}

async function create (iss: string, fetch: Fetch): Promise<jose.RemoteJWKSet> {
  const jose = await load()
  const configuration = await discover(iss, fetch)

  return jose.createRemoteJWKSet(new URL(configuration.jwks_uri), {
    [jose.customFetch]: fetch
  })
}

import * as jose from 'jose'
import type { Configuration } from './Configuration'

const cache = new Map<string, Configuration>()

export async function discover (iss: string): Promise<Configuration> {
  if (!cache.has(iss)) {
    const configuration = await fetchConfiguration(iss)

    cache.set(iss, configuration)
  }

  return cache.get(iss)!
}

async function fetchConfiguration (iss: string): Promise<Configuration> {
  const response = await fetch(`${iss}/.well-known/openid-configuration`)

  if (!response.ok)
    throw new Error('Failed to fetch OIDC configuration')

  return await response.json() as Configuration
}

export async function createRemoteJWKSet (iss: string): Promise<ReturnType<typeof jose.createRemoteJWKSet>> {
  const configuration = await discover(iss)
  const url = new URL(configuration.jwks_uri)

  return jose.createRemoteJWKSet(url)
}

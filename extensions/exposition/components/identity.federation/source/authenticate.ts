import { Err } from 'error-value'
import { resolve } from './lib'
import type { JWTPayload } from 'jose'
import type { Maybe } from '@toa.io/types'
import type { Context, Scheme } from './types'

export async function effect ({ scheme, authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  context.logs.debug('Authenticating', { scheme, authority, credentials })

  const claims = await resolve(scheme, credentials, context)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  context.logs.debug('Token claims', claims)

  const identity = context.configuration.assert !== false
    ? await context.local.ensure({ entity: { authority, iss, sub } })
    : await context.local.observe({ query: { criteria: `authority==${authority};iss==${iss};sub==${sub}` } })

  if (identity === null)
    return ERR_NOT_FOUND

  if (identity instanceof Error)
    return identity

  return { identity: { id: identity.identity ?? identity.id, claims } }
}

const ERR_NOT_FOUND = new Err('NOT_FOUND')

interface Input {
  scheme: Scheme
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
    claims: JWTPayload
  }
}

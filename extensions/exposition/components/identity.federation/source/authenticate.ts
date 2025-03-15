import { Err } from 'error-value'
import { decode } from './lib'
import type { JWTPayload } from 'jose'
import type { Maybe } from '@toa.io/types'
import type { Context } from './types'

export async function effect ({ authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  const claims = await decode(credentials, context.configuration.trust, context.stash)

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

  return { identity: { id: identity.id, claims } }
}

const ERR_NOT_FOUND = new Err('NOT_FOUND')

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
    claims: JWTPayload
  }
}

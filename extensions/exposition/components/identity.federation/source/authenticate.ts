import { Err } from 'error-value'
import { newid } from '@toa.io/generic'
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

  const query = { criteria: `authority==${authority};iss==${iss};sub==${sub}` }

  const credential = context.configuration.assert !== false
    ? await context.local.ensure({
      query,
      entity: { authority, iss, sub, identity: newid() }
    })
    : await context.local.observe({ query })

  if (credential === null)
    return ERR_NOT_FOUND

  if (credential instanceof Error)
    return credential

  return { identity: { id: credential.identity, claims } }
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

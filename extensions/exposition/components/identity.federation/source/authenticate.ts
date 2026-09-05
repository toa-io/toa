import { newid, quote } from '@toa.io/generic'
import { principal, resolve } from './lib/index.js'
import type { JWTPayload } from 'jose'
import type { Maybe } from '@toa.io/core/types'
import type { Context, Scheme } from './types/index.js'

export async function effect ({ scheme, authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  context.logs.debug('Authenticating', { scheme, authority })

  const claims = await resolve(scheme, credentials, context)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  context.logs.debug('Token claims', claims)

  const query = { criteria: `authority==${quote(authority)};iss==${quote(iss)};sub==${quote(sub)}` }

  const asserted = newid()

  const credential = context.configuration.assert !== false
    ? await context.local.ensure({
      query,
      entity: { authority, iss, sub, identity: asserted }
    })
    : await context.local.observe({ query })

  if (credential === null)
    return ERR_NOT_FOUND

  if (credential instanceof Error)
    return credential

  // the Identity this call has just created is the only one whose Role is not granted yet
  if (credential.identity === asserted)
    await principal(credential, context)

  return { identity: { id: credential.identity, claims } }
}

const ERR_NOT_FOUND = new (class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND'
})()

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

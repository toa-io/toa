import { type Maybe } from '@toa.io/types'
import { Err } from 'error-value'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import { decode } from './lib/jwt'
import type { Context, IdToken } from './types'

async function authenticate ({ authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  const { iss, sub, aud } = await decode(credentials, context.configuration.trust)

  const identity = context.configuration.implicit
    ? await context.local.ensure({ entity: { authority, iss, sub } })
    : await context.local.observe({ query: { criteria: `authority==${authority};iss==${iss};sub==${sub}` } })

  if (identity === null)
    return ERR_NOT_FOUND

  return { identity: { id: identity.id, claim: { iss, sub, aud } } }
}

const ERR_NOT_FOUND = Err('NOT_FOUND')

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
    claim: Pick<IdToken, 'iss' | 'sub' | 'aud'>
  }
}

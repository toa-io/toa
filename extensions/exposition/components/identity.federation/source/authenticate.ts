import { type Maybe } from '@toa.io/types'
import { Err } from 'error-value'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import type { Context, IdToken } from './types'

async function authenticate ({ authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  const claims = await context.local.decode({ input: credentials })
  const { iss, sub } = claims

  const identity = context.configuration.implicit
    ? await context.local.ensure({ entity: { authority, iss, sub } })
    : await context.local.observe({ query: { criteria: `authority==${authority};iss==${iss};sub==${sub}` } })

  if (identity === null)
    return ERR_NOT_FOUND

  return { identity: { id: identity.id, claims } }
}

const ERR_NOT_FOUND = new Err('NOT_FOUND')

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
    claims: Pick<IdToken, 'iss' | 'sub' | 'aud'>
  }
}

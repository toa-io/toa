import { type Maybe } from '@toa.io/types'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import { decode } from './lib/jwt'
import type { Context, IdToken } from './types'

async function authenticate ({ authority, credentials }: Input, context: Context): Promise<Maybe<Output>> {
  const { iss, sub, aud } = await decode(credentials, context.configuration.trust)
  const { id } = await context.local.ensure({ entity: { authority, iss, sub } })

  return { identity: { id, claim: { iss, sub, aud } } }
}

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

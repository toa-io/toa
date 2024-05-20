import { type Maybe } from '@toa.io/types'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import { validateIdToken } from './lib/jwt'
import type { AuthenticateInput, AuthenticateOutput, Context } from './types'

async function authenticate ({ authority, credentials }: AuthenticateInput,
  context: Context): Promise<Maybe<AuthenticateOutput>> {
  const { iss, sub } = await validateIdToken(credentials, context.configuration.trust)
  const { id } = await context.local.ensure({ entity: { authority, iss, sub } })

  return { identity: { id } }
}

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

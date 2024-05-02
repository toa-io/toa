import { type Maybe } from '@toa.io/types'
import { Err } from 'error-value'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import { validateIdToken } from './lib/jwt'
import type { AuthenticateInput, AuthenticateOutput, Context } from './types'
import type { Request } from '@toa.io/core'

async function authenticate ({ authority, credentials }: AuthenticateInput,
  context: Context): Promise<Maybe<AuthenticateOutput>> {
  const { iss, sub } = await validateIdToken(credentials, context.configuration.trust)

  const request: Request = { query: { criteria: `authority==${authority};iss==${iss};sub==${sub}` } }

  let id = (await context.local.observe(request))?.id

  if (id === undefined) {
    if (context.configuration.explicit_identity_creation === true)
      return NOT_FOUND

    id = (await context.local.transit({ input: { authority, iss, sub } })).id
  }

  return { identity: { id } }
}

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

const NOT_FOUND = Err('NOT_FOUND')

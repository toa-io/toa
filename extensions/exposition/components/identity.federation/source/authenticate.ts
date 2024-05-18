import { type Maybe } from '@toa.io/types'
import { Err } from 'error-value'
import { assertionsAsValues } from './lib/assertions-as-values.js'
import { validateIdToken } from './lib/jwt'
import type { AuthenticateInput, AuthenticateOutput, Context } from './types'
import type { Request } from '@toa.io/core'

async function authenticate ({ authority, credentials }: AuthenticateInput,
  context: Context): Promise<Maybe<AuthenticateOutput>> {
  const { iss, sub } = await validateIdToken(credentials, context.configuration.trust)

  if (context.configuration.explicit_identity_creation === true) {
    const request: Request = { query: { criteria: `authority==${authority};iss==${iss};sub==${sub}` } }
    const id = (await context.local.observe(request))?.id

    if (id === undefined)
      return NOT_FOUND
    else
      return { identity: { id } }
  } else {
    const { id } = await context.local.ensure({ entity: { authority, iss, sub } })

    return { identity: { id } }
  }
}

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

const NOT_FOUND = Err('NOT_FOUND')

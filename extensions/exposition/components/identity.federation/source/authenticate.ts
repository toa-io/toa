import { type Maybe } from '@toa.io/types'
import { Err } from 'error-value'
import { assertionsAsValues } from './assertions-as-values.cjs'
import {
  validateIdToken
} from './jwt.cjs'
import type { Request } from '@toa.io/core'
import type { AuthenticateOutput, Context } from './types'

async function authenticate (input: string,
  context: Context): Promise<Maybe<AuthenticateOutput>> {
  const { iss, sub } = await validateIdToken(input, {
    allowedIssuers: context.configuration.allowed_issuers,
    allowedAudiences: context.configuration.acceptable_audience
  })

  const request: Request = { query: { criteria: `iss==${iss};sub==${sub}` } }

  let id = (await context.local.observe(request))?.id

  if (id === undefined) {
    if (context.configuration.explicit_identity_creation === true) return Err('NOT_FOUND')

    id = (await context.local.transit({ input: { iss, sub } })).id
  }

  return { identity: { id } }
}

// Exporting as a function returning assertion errors as values
export const computation = assertionsAsValues(authenticate)

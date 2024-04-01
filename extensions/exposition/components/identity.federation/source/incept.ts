import { assertionsAsValues } from './lib/assertions-as-values.js'
import { validateIdToken } from './lib/jwt'
import type { Request } from '@toa.io/core'
import type { Context, Entity } from './types'

async function incept (input: InceptInput, context: Context): Promise<InceptOutput> {
  const { iss, sub } = await validateIdToken(input.credentials, context.configuration.trust)

  const request: Request = {
    input: { authority: input.authority, iss, sub } satisfies Omit<Entity, 'id'>,
    query: { id: input.id }
  }

  return await context.local.transit(request)
}

interface InceptInput {
  authority: string
  id: string
  credentials: string
}

interface InceptOutput {
  id: string
}

export const effect = assertionsAsValues(incept)

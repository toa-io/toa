import { assertionsAsValues } from './assertions-as-values.cjs'
import { validateIdToken } from './jwt.cjs'
import type { Request } from '@toa.io/core'
import type { Context, Entity } from './types'

async function create (input: CreateInput, context: Context): Promise<CreateOutput> {
  const { iss, sub } = await validateIdToken(input.credentials, context.configuration.trust)

  const request: Request = {
    input: { iss, sub } satisfies Omit<Entity, 'id'>,
    query: { id: input.id }
  }

  return await context.local.transit(request)
}

interface CreateInput {
  id: string
  credentials: string
}

interface CreateOutput {
  id: string
}

export const effect = assertionsAsValues(create)

import { assertionsAsValues } from './lib/assertions-as-values.js'
import { validateIdToken } from './lib/jwt'
import type { Request } from '@toa.io/core'
import type { Context, Entity } from './types'

async function incept (input: Input, context: Context): Promise<Output> {
  const { iss, sub } = await validateIdToken(input.credentials, context.configuration.trust)

  const request: Request = { input: { authority: input.authority, iss, sub } satisfies Omit<Entity, 'id'> }

  if (input.id !== undefined)
    request.query = { id: input.id }

  return await context.local.transit(request)
}

interface Input {
  authority: string
  credentials: string
  id?: string
}

interface Output {
  id: string
}

export const effect = assertionsAsValues(incept)

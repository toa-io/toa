import { Err } from 'error-value'
import { resolve } from './lib'
import type { Context, Entity, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Entity | Error> {
  const claims = await resolve(input.scheme, input.credentials, context)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  const existent = await context.local.observe({
    query: { criteria: `authority==${input.authority};iss==${iss};sub==${sub}`, deleted: true }
  })

  const record = { authority: input.authority, iss, sub, identity: input.id }

  if (existent === null)
    return await context.local.transit({ input: record })

  if (existent._deleted === undefined || existent._deleted === null)
    return existent.identity === input.id ? existent : ERR_EXISTS

  // a deleted record still occupies the unique index, so the transition revives it
  return await context.local.transit({
    input: record,
    query: { id: existent.id, deleted: true }
  })
}

export interface Input {
  authority: string
  scheme: Scheme
  credentials: string
  id: string
}

const ERR_EXISTS = new Err('EXISTS', 'Federation credentials are associated with another Identity')

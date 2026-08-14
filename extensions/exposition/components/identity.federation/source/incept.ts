import { Err } from 'error-value'
import { resolve } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Entity | Error> {
  const claims = await resolve(input.scheme, input.credentials, context)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  if (input.id === undefined) {
    const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } }

    return await context.local.transit(request)
  }

  const existent = await context.local.observe({
    query: { criteria: `authority==${input.authority};iss==${iss};sub==${sub}` }
  })

  if (existent !== null)
    return (existent.identity ?? existent.id) === input.id ? existent : ERR_EXISTS

  return await context.local.transit({
    input: { authority: input.authority, iss, sub, identity: input.id }
  })
}

export interface Input {
  authority: string
  scheme: Scheme
  credentials: string
  id?: string
}

const ERR_EXISTS = new Err('EXISTS', 'Federation credentials are associated with another Identity')

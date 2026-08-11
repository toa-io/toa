import { Err } from 'error-value'
import { decode, exchange, type Ctx } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, TransitInput, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const ctx: Ctx = {
    trust: context.configuration.trust,
    logs: context.logs
  }

  const claims = input.scheme === 'bearer'
    ? await decode(input.credentials, ctx)
    : await exchange(input.credentials, ctx)

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
    return (existent.identity ?? existent.id) === input.id ? { id: input.id } : ERR_EXISTS

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

export interface Output {
  id: string
}

const ERR_EXISTS = new Err('EXISTS', 'Federation credentials are associated with another Identity')

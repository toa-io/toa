import { decode, exchange, type Ctx } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput, Scheme } from './types'

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
  const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } }

  if (input.id !== undefined)
    request.query = { id: input.id }

  return await context.local.transit(request)
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

import { decode } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const payload = await decode(input.credentials, context.configuration.trust, context.stash)

  if (payload instanceof Error)
    return payload

  const { iss, sub } = payload
  const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } satisfies Omit<Entity, 'id'> }

  if (input.id !== undefined)
    request.query = { id: input.id }

  return await context.local.transit(request)
}

export interface Input {
  authority: string
  credentials: string
  id?: string
}

export interface Output {
  id: string
}

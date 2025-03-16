import { Err } from 'error-value'
import { decode } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  if (input.scheme === 'code') return ERR_SCHEME

  const payload = await decode(input.credentials, {
    trust: context.configuration.trust,
    stash: context.stash,
    logs: context.logs
  })

  if (payload instanceof Error)
    return payload

  const { iss, sub } = payload
  const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } satisfies Omit<Entity, 'id'> }

  if (input.id !== undefined)
    request.query = { id: input.id }

  return await context.local.transit(request)
}

const ERR_SCHEME = new Err('ERR_SCHEME', 'Unsupported scheme')

export interface Input {
  authority: string
  credentials: string
  scheme?: Scheme
  id?: string
}

export interface Output {
  id: string
}

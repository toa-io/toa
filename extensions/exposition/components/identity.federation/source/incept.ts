import { Err } from 'error-value'
import { decode, exchange, type Ctx } from './lib'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const ctx: Ctx = {
    trust: context.configuration.trust,
    logs: context.logs,
    fetch: context.fetch
  }

  const claims = input.scheme === 'bearer'
    ? await decode(input.credentials, ctx)
    : await exchange(input.credentials, ctx)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  if (input.id === undefined) {
    const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } }

    return credential(await context.local.transit(request))
  }

  const existent = await context.local.observe({
    query: { criteria: `authority==${input.authority};iss==${iss};sub==${sub}` }
  })

  if (existent !== null)
    return (existent.identity ?? existent.id) === input.id ? credential(existent) : ERR_EXISTS

  return credential(await context.local.transit({
    input: { authority: input.authority, iss, sub, identity: input.id }
  }))
}

function credential ({ id, iss, _created }: Entity): Output {
  return { id, iss, _created }
}

export interface Input {
  authority: string
  scheme: Scheme
  credentials: string
  id?: string
}

export interface Output {
  id: string
  iss: string
  _created: number
}

const ERR_EXISTS = new Err('EXISTS', 'Federation credentials are associated with another Identity')

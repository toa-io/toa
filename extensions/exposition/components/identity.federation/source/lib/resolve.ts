import { decode } from './decode.js'
import { exchange } from './exchange.js'
import type { Ctx } from './Ctx.js'
import type { Payload } from './Payload.js'
import type { Context, Scheme } from '../types/index.js'

export async function resolve (scheme: Scheme, credentials: string, context: Context): Promise<Payload | Error> {
  const ctx: Ctx = {
    trust: context.configuration.trust,
    logs: context.logs,
    fetch: context.fetch
  }

  return scheme === 'bearer'
    ? await decode(credentials, ctx)
    : await exchange(credentials, ctx)
}

import { decode } from './decode.ts'
import { exchange } from './exchange.ts'
import type { Ctx } from './Ctx.ts'
import type { Payload } from './Payload.ts'
import type { Context, Scheme } from '../types/index.ts'

export async function resolve(
  scheme: Scheme,
  credentials: string,
  context: Context
): Promise<Payload | Error> {
  const ctx: Ctx = {
    trust: context.configuration.trust,
    logs: context.logs,
    fetch: context.fetch
  }

  return scheme === 'bearer'
    ? await decode(credentials, ctx)
    : await exchange(credentials, ctx)
}

import { decode } from './decode'
import { exchange } from './exchange'
import type { Ctx } from './Ctx'
import type { Payload } from './Payload'
import type { Context, Scheme } from '../types'

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

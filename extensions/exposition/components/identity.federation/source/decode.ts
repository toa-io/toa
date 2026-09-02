import { decode } from './lib/index.js'
import type { JWTPayload } from 'jose'
import type { Context } from './types/index.js'

export async function effect (token: string, context: Context): Promise<JWTPayload | Error> {
  return await decode(token, {
    trust: context.configuration.trust,
    logs: context.logs,
    fetch: context.fetch
  })
}

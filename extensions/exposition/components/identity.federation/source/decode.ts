import { decode } from './lib'
import type { JWTPayload } from 'jose'
import type { Context } from './types'

export async function effect (token: string, context: Context): Promise<JWTPayload | Error> {
  return await decode(token, context.configuration.trust, context.stash)
}

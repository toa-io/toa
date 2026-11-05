import { publish } from './lib/keys.ts'
import type { JWK } from 'jose'
import type { Context } from './types/index.ts'

/** Every key, the ones that no longer sign included: a token they signed is still valid. */
export async function computation(_: null, context: Context): Promise<Output> {
  return { keys: await Promise.all(context.configuration.keys.map(publish)) }
}

interface Output {
  keys: JWK[]
}

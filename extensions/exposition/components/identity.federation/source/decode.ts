import * as jwt from './lib/jwt'
import { assertionsAsValues } from './lib/assertions-as-values'
import type { Context, IdToken } from './types'

async function decode (token: string, context: Context): Promise<IdToken> {
  return await jwt.decode(token, context.configuration.trust)
}

export const computation = assertionsAsValues(decode)

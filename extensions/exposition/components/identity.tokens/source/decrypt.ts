import { V3 } from 'paseto'
import { type Reply } from '@toa.io/types'
import { type Context, type Claim, type DecryptOutput } from './types'

export async function computation (token: string, context: Context):
Promise<Reply<DecryptOutput>> {
  let refresh = false
  let claim = await decrypt(token, context.configuration.key0)

  if (claim === null && context.configuration.key1 !== undefined) {
    refresh = true
    claim = await decrypt(token, context.configuration.key1)
  }

  if (claim === null) return { error: { code: 0 } }
  else return { output: { identity: claim.identity, iat: claim.iat, exp: claim.exp, refresh } }
}

async function decrypt (token: string, key: string): Promise<Claim | null> {
  try {
    return await V3.decrypt<Claim>(token, key)
  } catch {
    return null
  }
}

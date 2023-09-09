import { V3 } from 'paseto'
import { Nope, type Nopeable } from 'nopeable'
import { type Context, type Claim, type DecryptOutput } from './types'

export async function computation (token: string, context: Context):
Promise<Nopeable<DecryptOutput>> {
  let refresh = false
  let claim = await decrypt(token, context.configuration.key0)

  if (claim === null && context.configuration.key1 !== undefined) {
    refresh = true
    claim = await decrypt(token, context.configuration.key1)
  }

  if (claim === null) return new Nope('INVALID_TOKEN', 'Invalid token')
  else return { identity: claim.identity, iat: claim.iat, exp: claim.exp, refresh }
}

async function decrypt (token: string, key: string): Promise<Claim | null> {
  try {
    return await V3.decrypt<Claim>(token, key)
  } catch {
    return null
  }
}

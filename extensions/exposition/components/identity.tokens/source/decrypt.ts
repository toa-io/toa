import { type Reply } from '@toa.io/types'
import { V3 } from 'paseto'
import { type Context, type Claim, type DecryptOutput } from './types'
import { KEY } from './const'

export async function computation (token: string, context: Context): Promise<Reply<DecryptOutput>> {
  const claim = await decrypt(token, context.configuration.key0)

  if (claim === null) return { error: { code: 0 } }
  else return { output: { payload: claim[KEY], iat: claim.iat, exp: claim.exp } }
}

async function decrypt (token: string, key: string): Promise<Claim | null> {
  try {
    return await V3.decrypt<Claim>(token, key)
  } catch (e) {
    return null
  }
}

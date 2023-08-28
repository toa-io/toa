import { type Reply } from '@toa.io/types'
import { V3 } from 'paseto'
import * as dev from './dev'
import { type Context, type ResolveOutput } from './types'
import { KEY } from './const'

export async function computation (token: string, context: Context): Promise<Reply<ResolveOutput>> {
  const key = process.env.TOA_DEV === '1'
    ? dev.secret
    : context.configuration.key0

  try {
    const claim = await V3.decrypt(token, key)
    const payload = claim[KEY] as object

    return { output: { payload } }
  } catch {
    return { error: { code: 0 } }
  }
}

import { type Reply } from '@toa.io/types'
import { V3 } from 'paseto'
import * as dev from './dev'
import { type Context } from './types'
import { KEY } from './const'

export async function computation (token: string, context: Context): Promise<Reply<Output>> {
  const key = process.env.TOA_DEV === '1'
    ? dev.secret
    : context.configuration.secret

  try {
    const claim = await V3.decrypt(token, key)
    const identity = claim[KEY] as object

    return { output: { identity } }
  } catch {
    return { error: { code: 0 } }
  }
}

interface Output {
  identity: object
  upgrade?: string
}

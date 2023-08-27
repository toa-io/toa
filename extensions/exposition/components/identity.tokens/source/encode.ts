import { V3 } from 'paseto'
import { type Reply } from '@toa.io/types'
import * as dev from './dev'
import { KEY } from './const'
import { type Context } from './types'

export async function computation (input: object, context: Context): Promise<Reply<string>> {
  const key = process.env.TOA_DEV === '1'
    ? dev.secret
    : context.configuration.secret

  const exp = new Date(Date.now() + context.configuration.lifetime * 1000).toISOString()
  const payload = { [KEY]: input, exp }
  const token = await V3.encrypt(payload, key, { iat: false })

  return { output: token }
}

import { V3 } from 'paseto'
import { type Reply } from '@toa.io/types'
import { KEY } from './const'
import { type Context, type EncryptInput } from './types'

export async function effect (input: EncryptInput, context: Context): Promise<Reply<string>> {
  const key = context.configuration.key0

  const exp = input.lifetime === 0
    ? undefined
    : new Date(Date.now() + input.lifetime * 1000).toISOString()

  const payload = { [KEY]: input.payload, exp }
  const token = await V3.encrypt(payload, key)
  const output = token.slice('v3.local.'.length)

  return { output }
}

import { V3 } from 'paseto'
import { type Reply } from '@toa.io/types'
import { KEY } from './const'
import { type Context, type EncryptInput } from './types'

export async function effect (input: EncryptInput, context: Context): Promise<Reply<string>> {
  const key = context.configuration.key0

  const lifetime = input.lifetime ?? context.configuration.lifetime

  const exp = lifetime === 0
    ? undefined
    : new Date(Date.now() + lifetime * 1000).toISOString()

  const payload = { [KEY]: input.payload, exp }
  const output = await V3.encrypt(payload, key)

  return { output }
}

import { type ProduceOptions, V3 } from 'paseto'
import { type Reply } from '@toa.io/types'
import * as dev from './dev'
import { KEY } from './const'
import { type Context } from './types'

export async function computation (input: Input, context: Context): Promise<Reply<string>> {
  const key = process.env.TOA_DEV === '1'
    ? dev.secret
    : context.configuration.key0

  const exp = input.lifetime === 0
    ? undefined
    : new Date(Date.now() + input.lifetime * 1000).toISOString()

  const payload = { [KEY]: input.payload, exp }
  const token = await V3.encrypt(payload, key, OPTIONS)

  return { output: token }
}

const OPTIONS: ProduceOptions = { iat: false }

interface Input {
  payload: object
  lifetime: number
}

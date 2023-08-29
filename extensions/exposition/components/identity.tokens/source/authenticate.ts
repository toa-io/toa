import { type Reply } from '@toa.io/types'
import { type AuthenticateOutput, type Context } from './types'

export async function computation (token: string, context: Context):
Promise<Reply<AuthenticateOutput>> {
  const reply = await context.local.decrypt({ input: token })

  if (reply.error !== undefined)
    return { error: reply.error }

  if (reply.output === undefined)
    throw new Error('?')

  const identity = reply.output.payload

  const iat = new Date(reply.output.iat).getTime()
  const exp = new Date(reply.output.exp).getTime()
  const now = new Date().getTime()
  const lifetime = exp - iat
  const stale = iat + lifetime * context.configuration.reissue < now

  return { output: { identity, stale } }
}

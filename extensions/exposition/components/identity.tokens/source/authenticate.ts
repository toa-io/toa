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
  const refresh = new Date(reply.output.iat).getTime() + context.configuration.refresh < Date.now()
  const stale = refresh || reply.output.refresh

  return { output: { identity, stale } }
}

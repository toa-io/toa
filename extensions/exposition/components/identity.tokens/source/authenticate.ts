import { type Reply } from '@toa.io/types'
import { type AuthenticateOutput, type Context } from './types'

export async function computation (token: string, context: Context):
Promise<Reply<AuthenticateOutput>> {
  const reply = await context.local.resolve({ input: token })

  if (reply.error !== undefined)
    return { error: reply.error }

  if (reply.output === undefined)
    throw new Error('?')

  return { output: { identity: reply.output.payload } }
}

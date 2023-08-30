import { type Reply } from '@toa.io/types'
import { type AuthenticateOutput, type Context, type DecryptOutput } from './types'

export async function computation (token: string, context: Context):
Promise<Reply<AuthenticateOutput>> {
  const reply = await context.local.decrypt({ input: token })

  if (reply.error !== undefined)
    return { error: reply.error }

  if (reply.output === undefined)
    throw new Error('?')

  const identity = reply.output.payload
  const stale = reply.output.refresh || isStale(reply.output, context)

  return { output: { identity, stale } }
}

function isStale (claim: DecryptOutput, context: Context): boolean {
  const iat = new Date(claim.iat).getTime()
  const exp = new Date(claim.exp).getTime()
  const now = new Date().getTime()
  const lifetime = exp - iat

  return iat + lifetime * context.configuration.stale < now
}

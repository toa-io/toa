import { type Reply } from '@toa.io/types'
import { type AuthenticateOutput, type Context } from './types'

export async function computation (token: string, context: Context):
Promise<Reply<AuthenticateOutput>> {
  const decryption = await context.local.decrypt({ input: token })

  if (decryption.error !== undefined)
    return { error: decryption.error }

  if (decryption.output === undefined)
    throw new Error('?')

  const identity = decryption.output.identity
  const permanent = decryption.output.exp === undefined
  const iat = new Date(decryption.output.iat).getTime()
  const stale = !permanent && (iat + context.configuration.refresh < Date.now())

  if (stale) {
    const revocation = await context.local.observe({ query: { id: identity.id } })

    if (revocation?.output?.revokedAt !== undefined && iat < revocation.output.revokedAt)
      return { error: { code: 1 } }
  }

  const refresh = stale || decryption.output.refresh

  return { output: { identity, refresh } }
}

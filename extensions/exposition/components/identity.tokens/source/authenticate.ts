import { Nope, type Nopeable } from 'nopeable'
import { type AuthenticateOutput, type Context } from './types'

export async function computation
(token: string, context: Context): Promise<Nopeable<AuthenticateOutput>> {
  const claim = await context.local.decrypt({ input: token })

  if (claim instanceof Nope)
    return claim

  const identity = claim.identity
  const iat = new Date(claim.iat).getTime()
  const transient = claim.exp !== undefined
  const stale = transient && (iat + context.configuration.refresh < Date.now())

  if (stale) {
    const revocation = await context.local.observe({ query: { id: identity.id } })

    if (revocation instanceof Nope)
      return revocation

    if (revocation?.revokedAt !== undefined && iat < revocation.revokedAt)
      return new Nope('REVOKED')
  }

  const refresh = stale || claim.refresh

  return { identity, refresh }
}

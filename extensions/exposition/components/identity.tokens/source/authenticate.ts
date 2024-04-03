import { type Maybe, type Operation } from '@toa.io/types'
import type { AuthenticateInput, AuthenticateOutput, Context } from './types'

export class Computation implements Operation {
  private refresh: number = 0
  private decrypt: Context['local']['decrypt'] = undefined as unknown as Context['local']['decrypt']
  private observe: Context['local']['observe'] = undefined as unknown as Context['local']['observe']

  public mount (context: Context): void {
    this.refresh = context.configuration.refresh * 1000
    this.decrypt = context.local.decrypt
    this.observe = context.local.observe
  }

  public async execute (input: AuthenticateInput): Promise<Maybe<AuthenticateOutput>> {
    const claim = await this.decrypt({ input: input.credentials })

    if (claim instanceof Error)
      return claim

    if (claim.authority !== input.authority)
      return ERR_AUTHORITY

    const identity = claim.identity
    const iat = new Date(claim.iat).getTime()
    const transient = claim.exp !== undefined
    const stale = transient && (iat + this.refresh < Date.now())

    if (stale) {
      const revocation = await this.observe({ query: { id: identity.id } })

      if (revocation?.revokedAt !== undefined && iat < revocation.revokedAt)
        return ERR_TOKEN_REVOKED
    }

    const refresh = stale || claim.refresh

    return {
      identity,
      refresh
    }
  }
}

const ERR_AUTHORITY = new Error('AUTHORITY_MISMATCH')
const ERR_TOKEN_REVOKED = new Error('TOKEN_REVOKED')

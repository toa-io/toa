import type { Maybe, Operation } from '@toa.io/types'
import type { AuthenticateInput, AuthenticateOutput, Context } from './lib/index.js'

export class Computation implements Operation {
  private refresh: number = 0
  private decrypt!: Context['local']['decrypt']
  private observe!: Context['local']['observe']

  public mount (context: Context): void {
    this.refresh = context.configuration.refresh * 1000
    this.decrypt = context.local.decrypt
    this.observe = context.local.observe
  }

  public async execute (input: AuthenticateInput): Promise<Maybe<AuthenticateOutput>> {
    const claims = await this.decrypt({ input: input.credentials })

    if (claims instanceof Error)
      return claims

    if (claims.iss !== input.authority)
      return ERR_AUTHORITY

    const identity = claims.identity
    const iat = new Date(claims.iat).getTime()
    const transient = claims.exp !== undefined
    const stale = transient && (iat + this.refresh < Date.now())

    if (stale) {
      const revocation = await this.observe({ query: { id: identity.id } })

      if (revocation?.revokedAt !== undefined && iat < revocation.revokedAt)
        return ERR_TOKEN_REVOKED
    }

    const refresh = stale || claims.refresh

    return {
      identity,
      refresh
    }
  }
}

const ERR_AUTHORITY = new (class AuthorityMismatchError extends Error {
  public readonly code = 'AUTHORITY_MISMATCH'
})()

const ERR_TOKEN_REVOKED = new (class TokenRevokedError extends Error {
  public readonly code = 'TOKEN_REVOKED'
})()

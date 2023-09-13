import { Nope, type Nopeable } from 'nopeable'
import { type Operation } from '@toa.io/types'
import { type AuthenticateOutput, type Context } from './types'

export class Computation implements Operation {
  private refresh: number = 0
  private decrypt: Context['local']['decrypt'] = undefined as unknown as Context['local']['decrypt']
  private observe: Context['local']['observe'] = undefined as unknown as Context['local']['observe']

  public mount (context: Context): void {
    this.refresh = context.configuration.refresh * 1000
    this.decrypt = context.local.decrypt
    this.observe = context.local.observe
  }

  public async execute (token: string): Promise<Nopeable<AuthenticateOutput>> {
    const claim = await this.decrypt({ input: token })

    if (claim instanceof Nope)
      return claim

    const identity = claim.identity
    const iat = new Date(claim.iat).getTime()
    const transient = claim.exp !== undefined
    const stale = transient && (iat + this.refresh < Date.now())

    if (stale) {
      const revocation = await this.observe({ query: { id: identity.id } })

      if (revocation !== null && iat < revocation.revokedAt)
        return new Nope('REVOKED')
    }

    const refresh = stale || claim.refresh

    return { identity, refresh }
  }
}

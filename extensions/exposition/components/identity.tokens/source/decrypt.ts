import { V3 } from 'paseto'
import { Err } from 'error-value'
import type { Maybe, Operation } from '@toa.io/types'
import type { Context, Claims, DecryptOutput } from './lib'

export class Computation implements Operation {
  private latest!: string
  private keys!: Record<string, string>

  public mount (context: Context): void {
    this.latest = Object.keys(context.configuration.keys)[0]
    this.keys = context.configuration.keys
  }

  public async execute (token: string): Promise<Maybe<DecryptOutput>> {
    const kid = this.kid(token)

    if (kid instanceof Error)
      return kid

    const key = this.key(kid)

    if (key instanceof Error)
      return key

    const claims = await decrypt(token, key)

    if (claims instanceof Error)
      return claims

    return {
      iss: claims.iss,
      iat: claims.iat,
      exp: claims.exp,
      identity: claims.identity,
      refresh: kid !== this.latest
    }
  }

  private kid (token: string): string | Error {
    const [, , , footer] = token.split('.')

    if (footer === undefined)
      return ERR_INVALID_TOKEN

    return Buffer.from(footer, 'base64url').toString('utf-8')
  }

  private key (kid: string): string | Error {
    const key = this.keys[kid]

    if (key === undefined)
      return ERR_INVALID_KEY

    return key
  }
}

async function decrypt (token: string, key: string): Promise<Maybe<Claims>> {
  try {
    return await V3.decrypt<Claims>(token, key)
  } catch (e) {
    return ERR_INVALID_TOKEN
  }
}

const ERR_INVALID_TOKEN = new Err('INVALID_TOKEN')
const ERR_INVALID_KEY = new Err('INVALID_KEY')

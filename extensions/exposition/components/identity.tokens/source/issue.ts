import { quote } from '@toa.io/generic'
import type { Maybe } from '@toa.io/core/types'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Identity } from './lib/index.js'

export class Effect implements Operation {
  private keys!: Context['remote']['identity']['keys']
  private roles!: Context['remote']['identity']['roles']
  private encrypt!: Context['local']['encrypt']
  private lifetime!: number

  public mount (context: Context): void {
    this.keys = context.remote.identity.keys
    this.roles = context.remote.identity.roles
    this.encrypt = context.local.encrypt
    // seconds, as `input.lifetime` and `encrypt` both are
    this.lifetime = context.configuration.lifetime
  }

  public async execute (input: Input): Promise<Maybe<Output>> {
    const lifetime = input.lifetime ?? this.lifetime

    const expires = lifetime === 0
      ? undefined
      : new Date(Date.now() + lifetime * 1000).getTime()

    const key = await this.keys.create({
      input: {
        identity: input.identity,
        label: input.label,
        expires
      }
    })

    const roles = await this.roles.list({
      query: {
        criteria: `identity==${quote(input.identity)}`,
        limit: 1024
      }
    })

    const identity: Identity = {
      id: input.identity,
      roles
    }

    const { authority, scopes, permissions } = input

    const token = await this.encrypt({
      input: {
        authority,
        identity,
        lifetime,
        scopes,
        permissions,
        key
      }
    })

    if (token instanceof Error)
      return token

    return {
      kid: key.id,
      // technically, the token expires some time later
      ...(expires !== undefined && { exp: expires }),
      token
    }
  }
}

interface Input {
  authority: string
  identity: string
  label: string
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
}

interface Output {
  kid: string
  exp?: number
  token: string
}

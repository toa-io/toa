import type { Maybe, Operation } from '@toa.io/types'
import type { Context, Identity } from './lib'

export class Effect implements Operation {
  private keys!: Context['remote']['identity']['keys']
  private roles!: Context['remote']['identity']['roles']
  private encrypt!: Context['local']['encrypt']

  public mount (context: Context): void {
    this.keys = context.remote.identity.keys
    this.roles = context.remote.identity.roles
    this.encrypt = context.local.encrypt
  }

  public async execute (input: Input): Promise<Maybe<string>> {
    const key = await this.keys.create({
      input: {
        identity: input.identity,
        name: input.name
      }
    })

    const roles = await this.roles.list({
      query: {
        criteria: `identity==${input.identity}`,
        limit: 1024
      }
    })

    const identity: Identity = {
      id: input.identity,
      roles
    }

    const { authority, lifetime, scopes, permissions } = input

    return await this.encrypt({
      input: {
        authority,
        identity,
        lifetime,
        scopes,
        permissions,
        key
      }
    })
  }
}

interface Input {
  authority: string
  identity: string
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
  name?: string
}

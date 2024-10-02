import { V3 } from 'paseto'
import { Err } from 'error-value'
import type { Operation, Maybe } from '@toa.io/types'
import type { Identity, Claims, Context, EncryptInput, Key } from './lib'

export class Effect implements Operation {
  private key!: Key
  private lifetime: number = 0

  public mount (context: Context): void {
    const [id, secret] = Object.entries(context.configuration.keys)[0]

    this.key = { id, key: secret }
    this.lifetime = context.configuration.lifetime * 1000
  }

  public async execute (input: EncryptInput): Promise<Maybe<string>> {
    if (input.scopes?.some((scope) => !within(scope, input.identity.roles)) === true)
      return ERR_INACCESSIBLE_SCOPE

    const lifetime = input.lifetime === undefined ? this.lifetime : (input.lifetime * 1000)

    const exp = lifetime === 0
      ? undefined
      : new Date(Date.now() + lifetime).toISOString()

    const identity: Identity = {
      id: input.identity.id,
      roles: input.scopes ?? input.identity.roles
    }

    if (input.permissions !== undefined)
      identity.permissions = input.permissions

    const payload: Partial<Claims> = {
      identity,
      iss: input.authority
    }

    if (exp !== undefined)
      payload.exp = exp

    const key = input.key ?? this.key

    return await V3.encrypt(payload, key.key, { footer: { kid: key.id } })
  }
}

function within (scope: string, roles: string[]): boolean {
  return roles.some((role) => role === scope || scope.startsWith(role + ':'))
}

const ERR_INACCESSIBLE_SCOPE = new Err('INACCESSIBLE_SCOPE')

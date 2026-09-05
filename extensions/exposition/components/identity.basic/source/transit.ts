import { genSalt, hash } from 'bcryptjs'
import type { Maybe } from '@toa.io/core/types'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Entity, Principal, TransitInput, TransitOutput } from '../types/index.js'

export class Transition implements Operation {
  private rounds: number = 10
  private pepper: string = ''
  private principal?: Principal
  private tokens: Tokens = undefined as unknown as Tokens
  private keys: Keys = undefined as unknown as Keys
  private usernameRx: RegExp[] = []
  private passwordRx: RegExp[] = []

  public mount (context: Context): void {
    this.rounds = context.configuration.rounds
    this.pepper = context.configuration.pepper?.unwrap() ?? ''
    this.principal = context.configuration.principal
    this.tokens = context.remote.identity.tokens
    this.keys = context.remote.identity.keys

    this.usernameRx = toRx(context.configuration.username)
    this.passwordRx = toRx(context.configuration.password)
  }

  private locked (object: Entity): boolean {
    return this.principal !== undefined &&
      object.authority === this.principal.authority &&
      object.username === this.principal.username
  }

  public async execute (input: TransitInput, object: Entity): Promise<Maybe<TransitOutput>> {
    const deleted = object.DELETED !== undefined && object.DELETED !== null
    const existent = object.VERSION !== 0 && !deleted

    if (existent) {
      if (input.inception === true)
        return ERR_EXISTS

      await Promise.all([
        this.tokens.revoke({ query: { id: object.id } }),
        this.keys.revoke({ input: { identity: object.id } })
      ])
    } else if (input.authority !== undefined)
      // a record that is new and names no authority is refused by the entity contract
      object.authority = input.authority

    if (input.username !== undefined) {
      if (existent && this.locked(object))
        return ERR_PRINCIPAL_LOCKED

      if (invalid(input.username, this.usernameRx))
        return ERR_INVALID_USERNAME

      object.username = input.username
    }

    if (input.password !== undefined) {
      if (invalid(input.password, this.passwordRx))
        return ERR_INVALID_PASSWORD

      const salt = await genSalt(this.rounds)
      const spicy = input.password + this.pepper

      object.password = await hash(spicy, salt)
    }

    return { id: object.id }
  }
}

function toRx (expressions: string[]): RegExp[] {
  return expressions.map((expression) => new RegExp(expression))
}

function invalid (value: string, expressions: RegExp[]): boolean {
  return expressions.some((expression) => !expression.test(value))
}

const ERR_PRINCIPAL_LOCKED = new (class PrincipalLockedError extends Error {
  public readonly code = 'PRINCIPAL_LOCKED'
  public override readonly message = 'Principal username cannot be changed'
})()

const ERR_INVALID_USERNAME = new (class InvalidUsernameError extends Error {
  public readonly code = 'INVALID_USERNAME'
  public override readonly message = 'Username is not meeting the requirements'
})()

const ERR_INVALID_PASSWORD = new (class InvalidPasswordError extends Error {
  public readonly code = 'INVALID_PASSWORD'
  public override readonly message = 'Password is not meeting the requirements'
})()

const ERR_EXISTS = new (class ExistsError extends Error {
  public readonly code = 'EXISTS'
  public override readonly message = 'Basic credentials already exist'
})()

type Tokens = Context['remote']['identity']['tokens']
type Keys = Context['remote']['identity']['keys']

import { genSalt, hash } from 'bcryptjs'
import { Err } from 'error-value'
import type { Maybe, Operation } from '@toa.io/types'
import type { Context, Entity, TransitInput, TransitOutput } from './types'

export class Transition implements Operation {
  private rounds: number = 10
  private pepper: string = ''
  private principal?: string
  private tokens: Tokens = undefined as unknown as Tokens
  private usernameRx: RegExp[] = []
  private passwordRx: RegExp[] = []

  public mount (context: Context): void {
    this.rounds = context.configuration.rounds
    this.pepper = context.configuration.pepper
    this.principal = context.configuration.principal
    this.tokens = context.remote.identity.tokens

    this.usernameRx = toRx(context.configuration.username)
    this.passwordRx = toRx(context.configuration.password)
  }

  public async execute (input: TransitInput, object: Entity): Promise<Maybe<TransitOutput>> {
    const existent = object._version !== 0

    if (existent)
      await this.tokens.revoke({ query: { id: object.id } })
    else
      object.authority = input.authority

    if (input.username !== undefined) {
      if (existent && object.username === this.principal)
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

function toRx (input: string | string[]): RegExp[] {
  const expressions = typeof input === 'string' ? [input] : input

  return expressions.map((expression) => new RegExp(expression))
}

function invalid (value: string, expressions: RegExp[]): boolean {
  return expressions.some((expression) => !expression.test(value))
}

const ERR_PRINCIPAL_LOCKED = Err('PRINCIPAL_LOCKED', 'Principal username cannot be changed.')
const ERR_INVALID_USERNAME = Err('INVALID_USERNAME', 'Username is not meeting the requirements.')
const ERR_INVALID_PASSWORD = Err('INVALID_PASSWORD', 'Password is not meeting the requirements.')

type Tokens = Context['remote']['identity']['tokens']

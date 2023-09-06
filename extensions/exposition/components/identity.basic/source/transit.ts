import { genSalt, hash } from 'bcrypt'
import { type Operation, type Reply } from '@toa.io/types'
import { type Context, type Entity, type TransitInput, type TransitOutput } from './types'

export class Transition implements Operation {
  private rounds: number = 10
  private pepper: string = ''
  private principal?: string
  private tokens: Tokens = undefined as unknown as Tokens
  private usernameRx: RegExp[] = []
  private passwrodRx: RegExp[] = []

  public mount (context: Context): void {
    this.rounds = context.configuration.rounds
    this.pepper = context.configuration.pepper
    this.tokens = context.remote.identity.tokens
    this.principal = context.configuration.principal

    this.usernameRx = toRx(context.configuration.username)
    this.passwrodRx = toRx(context.configuration.password)
  }

  public async execute (input: TransitInput, object: Entity): Promise<Reply<TransitOutput>> {
    const existent = object._version > 0

    if (existent)
      await this.tokens.revoke({ query: { id: object.id } })

    if (input.username !== undefined) {
      if (existent && object.username === this.principal)
        return { error: { code: 2, message: 'Principal username cannot be changed.' } }

      if (invalid(input.username, this.usernameRx))
        return { error: { code: 0, message: 'Username is not meeting the requirements.' } }

      object.username = input.username
    }

    if (input.password !== undefined) {
      if (invalid(input.password, this.passwrodRx))
        return { error: { code: 1, message: 'Password is not meeting the requirements.' } }

      const salt = await genSalt(this.rounds)
      const spicy = input.password + this.pepper

      object.password = await hash(spicy, salt)
    }

    return { output: { id: object.id } }
  }
}

function toRx (input: string | string[]): RegExp[] {
  const expressions = typeof input === 'string' ? [input] : input

  return expressions.map((expression) => new RegExp(expression))
}

function invalid (value: string, expressions: RegExp[]): boolean {
  return expressions.some((expression) => !expression.test(value))
}

type Tokens = Context['remote']['identity']['tokens']

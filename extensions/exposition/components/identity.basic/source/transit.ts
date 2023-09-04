import { genSalt, hash } from 'bcrypt'
import { type Context, type Entity, type TransitInput } from './types'

export async function transition
(input: TransitInput, object: Entity, context: Context): Promise<void> {
  const existent = object.username !== undefined

  if (existent)
    await context.remote.identity.tokens.revoke({ query: { id: object.id } })

  if (input.username !== undefined)
    object.username = input.username

  if (input.password !== undefined) {
    const salt = await genSalt(context.configuration.rounds)
    const spicy = input.password + context.configuration.pepper

    object.password = await hash(spicy, salt)
  }
}

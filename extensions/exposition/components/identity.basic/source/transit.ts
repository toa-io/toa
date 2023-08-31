import { genSalt, hash } from 'bcrypt'
import { type Context, type TransitInput } from './types'

export async function transition
(input: TransitInput, object: TransitInput, context: Context): Promise<void> {
  if (input.username !== undefined)
    object.username = input.username

  if (input.password !== undefined) {
    const salt = await genSalt(context.configuration.rounds)
    const spicy = input.password + context.configuration.pepper

    object.password = await hash(spicy, salt)
  }
}

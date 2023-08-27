import { genSalt, hash } from 'bcrypt'
import { type Context, type Credentials } from './types'

export async function transition (input: Credentials,
  object: Credentials,
  context: Context): Promise<void> {
  const salt = await genSalt(context.configuration.rounds)
  const spicy = input.password + context.configuration.pepper

  object.password = await hash(spicy, salt)
}

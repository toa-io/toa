import { compare } from 'bcrypt'
import { type Query, type Reply } from '@toa.io/types'
import { type Context, type Credentials } from './types'

export async function computation (input: Credentials,
                                   context: Context): Promise<Reply<{ id: string }>> {
  const query: Query = { criteria: `username==${input.username}` }
  const reply = await context.local.observe({ query })

  if (reply === null)
    return { error: { code: 0 } }

  const { output, error } = reply

  if (error !== undefined)
    return { error }

  if (output === undefined)
    return { error: { code: 1 } }

  const password = input.password + context.configuration.pepper
  const match = await compare(password, output.password)

  if (match) return { output: { id: output.id } }
  else return { error: { code: 2 } }
}

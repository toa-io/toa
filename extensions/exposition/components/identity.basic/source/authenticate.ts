import { atob } from 'buffer'
import { compare } from 'bcrypt'
import { type Query, type Reply } from '@toa.io/types'
import { type Context } from './types'

export async function computation (input: string, context: Context): Promise<Reply<Output>> {
  const kv = atob(input)
  const [username, password] = kv.split(':')

  const query: Query = { criteria: `username==${username}` }
  const reply = await context.local.observe({ query })

  if (reply === null)
    return { error: { code: 0 } }

  const { output, error } = reply

  if (error !== undefined)
    return { error }

  if (output === undefined)
    return { error: { code: 1 } }

  const spicy = password + context.configuration.pepper
  const match = await compare(spicy, output.password)

  if (match) return { output: { identity: { id: output.id } } }
  else return { error: { code: 2 } }
}

interface Output {
  identity: object
}

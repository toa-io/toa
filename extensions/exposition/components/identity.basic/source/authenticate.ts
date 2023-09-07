import { atob } from 'buffer'
import { compare } from 'bcrypt'
import { type Query } from '@toa.io/types'
import { Nope, type Nopeable } from 'nopeable'
import { type Context } from './types'

export async function computation (input: string, context: Context): Promise<Nopeable<Output>> {
  const [username, password] = atob(input).split(':')
  const query: Query = { criteria: `username==${username}` }
  const credentials = await context.local.observe({ query })

  if (credentials instanceof Nope)
    return credentials

  if (credentials === null)
    return new Nope('NOT_FOUND')

  const spicy = password + context.configuration.pepper
  const match = await compare(spicy, credentials.password)

  if (match) return { identity: { id: credentials.id } }
  else return new Nope('PASSWORD_MISMATCH')
}

interface Output {
  identity: {
    id: string
  }
}

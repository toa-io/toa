import { compare } from 'bcryptjs'
import { type Query, type Maybe } from '@toa.io/types'
import { type Context } from './types.js'

export async function computation (input: Input, context: Context): Promise<Maybe<Output>> {
  const [username, password] = Buffer
    .from(input.credentials, 'base64')
    .toString()
    .split(':')

  const query: Query = { criteria: `authority==${input.authority};username=='${username}'` }
  const credentials = await context.local.observe({ query })

  if (credentials instanceof Error)
    return credentials

  if (credentials === null)
    return ERR_NOT_FOUND

  const spicy = password + (context.configuration.pepper?.unwrap() ?? '')
  const match = await compare(spicy, credentials.password)

  if (match)
    return { identity: { id: credentials.id } }
  else
    return ERR_PASSWORD_MISMATCH
}

const ERR_NOT_FOUND = new (class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND'
})()

const ERR_PASSWORD_MISMATCH = new (class PasswordMismatchError extends Error {
  public readonly code = 'PASSWORD_MISMATCH'
})()

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
  }
}

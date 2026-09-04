import { compare } from 'bcryptjs'
import { quote } from '@toa.io/generic'
import { type Query, type Maybe } from '@toa.io/types'
import { split } from './lib/credentials.js'
import { type Context } from '../types/index.js'

export async function computation (input: Input, context: Context): Promise<Maybe<Output>> {
  const pair = split(input.credentials)

  if (pair === null)
    return ERR_NOT_FOUND

  const [username, password] = pair

  const query: Query = {
    criteria: `authority==${quote(input.authority)};username==${quote(username)}`
  }
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

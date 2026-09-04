import { split } from './lib/credentials.js'
import type { Context } from '../types/index.js'
import type { Maybe } from '@toa.io/types'

export async function effect (input: Input, context: Context): Promise<Maybe<Output>> {
  const pair = split(input.credentials)

  if (pair === null)
    return INVALID_CREDENTIALS

  const [username, password] = pair

  const request = {
    input: {
      authority: input.authority,
      username,
      password
    },
    query: {
      id: input.id
    }
  }

  return await context.local.transit(request)
}

const INVALID_CREDENTIALS = new (class InvalidCredentialsError extends Error {
  public readonly code = 'INVALID_CREDENTIALS'
})()

interface Input {
  authority: string
  id: string
  credentials: string
}

interface Output {
  id: string
}

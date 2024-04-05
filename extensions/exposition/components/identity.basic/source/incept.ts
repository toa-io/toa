import { Err } from 'error-value'
import { type Context } from './types'
import type { Maybe } from '@toa.io/types'

export async function effect (input: Input, context: Context): Promise<Maybe<Output>> {
  const [username, password] = Buffer
    .from(input.credentials, 'base64')
    .toString()
    .split(':')

  if (typeof password !== 'string')
    return INVALID_CREDENTIALS

  const request = {
    input: { authority: input.authority, username, password },
    query: { id: input.id }
  }

  return await context.local.transit(request)
}

const INVALID_CREDENTIALS = Err('INVALID_CREDENTIALS')

interface Input {
  authority: string
  id: string
  credentials: string
}

interface Output {
  id: string
}

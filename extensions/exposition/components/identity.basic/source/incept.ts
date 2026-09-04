import { split } from './lib/credentials.js'
import type { Context } from '../types/index.js'
import type { Maybe } from '@toa.io/core'

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

  const incepted = await context.local.transit(request)

  if (incepted instanceof Error)
    return incepted

  await principal({ authority: input.authority, username }, incepted.id, context)

  return incepted
}

/**
 * The `system` Role is granted here, before the reply that mints a Token from these
 * credentials — the event that carries the same grant lands after it.
 */
async function principal (credentials: Credentials, id: string,
  context: Context): Promise<void> {
  const configured = context.configuration.principal

  if (configured === undefined ||
    configured.authority !== credentials.authority ||
    configured.username !== credentials.username)
    return

  await context.remote.identity.roles.principal({ input: { id } })
}

const INVALID_CREDENTIALS = new (class InvalidCredentialsError extends Error {
  public readonly code = 'INVALID_CREDENTIALS'
})()

interface Credentials {
  authority: string
  username: string
}

interface Input {
  authority: string
  id: string
  credentials: string
}

interface Output {
  id: string
}

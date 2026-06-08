import { Err } from 'error-value'
import type { Context } from './lib'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const { authority, credentials } = input
  const [username, code] = Buffer.from(credentials, 'base64').toString().split(':')

  if (code === undefined)
    return ERR_INVALID_CREDENTIALS

  const key = `${authority}:${username}:${code}`
  const n = await context.stash.del(key)

  if (n === 0) {
    context.logs.debug('OTP code not found', { key })

    return ERR_EXPIRED
  }

  const entry = await context.local.ensure({
    entity: {
      authority,
      username
    }
  })

  if (entry === null)
    return ERR_NOT_FOUND

  const id = entry.identity ?? entry.id // identity inception

  return { identity: { id } }
}

const ERR_INVALID_CREDENTIALS = new Err('INVALID_CREDENTIALS')
const ERR_EXPIRED = new Err('EXPIRED')
const ERR_NOT_FOUND = new Err('NOT_FOUND')

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
  }
}

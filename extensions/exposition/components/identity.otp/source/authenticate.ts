import type { Context } from './lib/index.js'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const { authority, credentials } = input
  const [username, code] = Buffer.from(credentials, 'base64').toString().split(':')

  if (code === undefined)
    return ERR_INVALID_CREDENTIALS

  const attempts = `${authority}:${username}:attempts`
  const attempt = await context.stash.incr(attempts)

  if (attempt === 1)
    await context.stash.expire(attempts, context.configuration.lifetime)

  if (attempt > context.configuration.attempts) {
    context.logs.debug('OTP attempts exceeded', { authority, username, attempt })

    return ERR_TOO_MANY_ATTEMPTS
  }

  const key = `${authority}:${username}:${code}`
  const n = await context.stash.del(key)

  if (n === 0) {
    context.logs.debug('OTP code not found', { authority, username, attempt })

    return ERR_EXPIRED
  }

  await context.stash.del(attempts)

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

const ERR_INVALID_CREDENTIALS = new (class InvalidCredentialsError extends Error {
  public readonly code = 'INVALID_CREDENTIALS'
})()

const ERR_EXPIRED = new (class ExpiredError extends Error {
  public readonly code = 'EXPIRED'
})()

const ERR_TOO_MANY_ATTEMPTS = new (class TooManyAttemptsError extends Error {
  public readonly code = 'TOO_MANY_ATTEMPTS'
})()

const ERR_NOT_FOUND = new (class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND'
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

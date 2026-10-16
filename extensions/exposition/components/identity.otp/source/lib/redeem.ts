import type { Context } from './Context.ts'

/**
 * Spends a code that `accepts` takes and answers what it was issued with: `SIGN_IN`, or the
 * identity the username is to be tied to. A code it does not take stays for the operation that
 * does, and counts as a wrong one.
 */
export async function redeem(
  { authority, username, code, accepts }: Redemption,
  context: Context
): Promise<string | Error> {
  const attempts = `${authority}:${username}:attempts`
  const attempt = await context.stash.incr(attempts)

  if (attempt === 1) await context.stash.expire(attempts, context.configuration.lifetime)

  if (attempt > context.configuration.attempts) {
    context.logs.debug('OTP attempts exceeded', { authority, username, attempt })

    return ERR_TOO_MANY_ATTEMPTS
  }

  const key = `${authority}:${username}:${code}`
  const issued = await context.stash.get(key)

  // of two requests with one code, the one that deletes it is the one it is spent on
  if (issued === null || !accepts(issued) || (await context.stash.del(key)) === 0) {
    context.logs.debug('OTP code not found', { authority, username, attempt })

    return ERR_EXPIRED
  }

  await context.stash.del(attempts)

  return issued
}

export const SIGN_IN = '1'

const ERR_EXPIRED = new Error('EXPIRED')

const ERR_TOO_MANY_ATTEMPTS = new Error('TOO_MANY_ATTEMPTS')

interface Redemption {
  authority: string
  username: string
  code: string
  accepts: (issued: string) => boolean
}

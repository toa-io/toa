import { createHash, randomBytes } from 'node:crypto'
import type { Code, Context } from '../../types/index.js'

/**
 * An authorization code is a bearer credential that lives for seconds. It is held under a
 * hash of itself, so a dump of the store hands out none of them, and redeemed with `GETDEL`,
 * so it is spent once however many requests arrive at once — the property the whole flow
 * rests on, since a replayed code is a stolen grant.
 */
export async function hold (authority: string, code: Code, context: Context): Promise<string> {
  const value = randomBytes(32).toString('base64url')

  await context.stash.set(key(authority, value), JSON.stringify(code),
    'EX', context.configuration.lifetime)

  return value
}

export async function spend (authority: string, value: string, context: Context): Promise<Code | null> {
  const held = await context.stash.getdel(key(authority, value))

  return held === null ? null : JSON.parse(held) as Code
}

/**
 * PKCE, RFC 7636: the client kept a verifier and sent its hash, and only the client that
 * began the flow can present the verifier now. `S256` alone — `plain` proves nothing.
 */
export function verifies (challenge: string, verifier: string): boolean {
  return digest(verifier) === challenge
}

export function digest (verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

function key (authority: string, value: string): string {
  return `oauth:code:${authority}:${createHash('sha256').update(value).digest('hex')}`
}

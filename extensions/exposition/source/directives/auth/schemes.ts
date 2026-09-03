import type { Remote, Scheme } from './types.js'

export const PROVIDERS: Record<Scheme, Remote> = {
  basic: 'basic',
  token: 'tokens',
  bearer: 'federation',
  code: 'federation',
  otp: 'otp'
}

export const INCEPTION: Remote[] = ['basic', 'federation']
export const PRIMARY: Scheme = 'token'

/**
 * The provider of a scheme, or nothing for a scheme that is not one — including a name a
 * plain object answers on its own, like `constructor`.
 */
export function provider (scheme: string): Remote | undefined {
  return Object.hasOwn(PROVIDERS, scheme) ? PROVIDERS[scheme as Scheme] : undefined
}

import type { Remote, Scheme } from './types.js'

/**
 * The providers of a scheme, in the order they are asked. More than one claims `Bearer`:
 * an OpenID `id_token` is federated, and a token this gateway issued is presented that way
 * by an OAuth client. Which of them a credential belongs to is each provider's own to say,
 * so the order here is only which is asked first.
 */
export const PROVIDERS: Record<Scheme, Remote[]> = {
  basic: ['basic'],
  token: ['tokens'],
  bearer: ['tokens', 'federation'],
  code: ['federation'],
  otp: ['otp']
}

export const INCEPTION: Remote[] = ['basic', 'federation']
export const PRIMARY: Remote = 'tokens'

/**
 * The providers of a scheme, or nothing for a scheme that is not one — including a name a
 * plain object answers on its own, like `constructor`.
 */
export function providers (scheme: string): Remote[] | undefined {
  return Object.hasOwn(PROVIDERS, scheme) ? PROVIDERS[scheme as Scheme] : undefined
}

/**
 * What a provider answers when the credentials are not of its kind. The next provider of
 * the scheme is asked; a provider that declines has done nothing, so asking is free of
 * effect — which asking one that rejects would not be.
 */
export const UNRECOGNIZED = 'UNRECOGNIZED'

/**
 * The rejection of credentials that are verifiable and owned by no identity: the one
 * inception goes ahead with.
 */
export const UNKNOWN = 'NOT_FOUND'

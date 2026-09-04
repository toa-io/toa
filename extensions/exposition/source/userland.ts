/**
 * What Exposition puts into an operation's input, for the operation to be written against.
 *
 * The gateway's own types are its business; these are the application's.
 */

/**
 * The identity behind the call, as `auth:delegate` embeds it:
 *
 * ```yaml
 * /echo:
 *   GET:
 *     auth:assert: true
 *     auth:delegate: identity
 *     endpoint: echo
 * ```
 *
 * ```javascript
 * export async function computation ({ identity }, context) { }
 * ```
 */
export interface Identity {
  readonly id: string

  /** What the identity holds. Delegation resolves them, so they are always here. */
  roles: string[]

  permissions?: Record<string, string[]>

  /** How the identity was authenticated; `null` for a transient one. */
  scheme: string | null

  /** Whether the credentials presented are due to be exchanged. */
  refresh: boolean

  /** The token's claims, where the identity was federated. */
  claims?: Claims
}

/** A federated token's payload: what it must carry, and whatever else the issuer put there. */
export interface Claims {
  iss: string
  sub: string
  aud?: string | string[]

  [claim: string]: unknown
}

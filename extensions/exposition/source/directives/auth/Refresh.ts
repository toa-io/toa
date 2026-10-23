import * as http from '../../HTTP/index.ts'
import { split } from './split.ts'
import { PRIMARY } from './schemes.ts'
import type { Component } from '@toa.io/core'
import type {
  AuthenticationResult,
  Context,
  Directive,
  Discovery,
  Identity
} from './types.ts'

/**
 * A token re-issued whatever its age. The token is re-issued where any is, at the end of the
 * request; this only marks it, once the token is known to be one that may be.
 */
export class Refresh implements Directive {
  private readonly discovery: Discovery
  private tokens: Component | null = null

  public constructor(discovery: Discovery) {
    this.discovery = discovery
  }

  /** Whether the token is one that may be refreshed cannot be told without presenting it. */
  public admits(identity: Identity | null): boolean | undefined {
    return identity === null ? false : undefined
  }

  public async authorize(identity: Identity | null, context: Context): Promise<boolean> {
    if (identity === null) return false

    // credentials of any other provider are answered with a new token anyway
    if (identity.provider !== PRIMARY) return true

    this.tokens ??= await this.discovery.tokens

    // the route is not known when the credential is read, so it is asked again
    const [, credentials] = split(context.request.headers.authorization!)

    const result = await this.tokens.invoke<AuthenticationResult>('authenticate', {
      input: { authority: context.authority, credentials, force: true }
    })

    if (result instanceof Error)
      if ((result as Error & { code?: string }).code === UNREFRESHABLE) return false
      else throw new http.Unauthorized()

    identity.refresh = true

    return true
  }

  /** Roles are read again when the token is re-issued, before the reply is written. */
  public reply(context: Context): http.OutgoingMessage {
    return { status: 200, body: context.identity }
  }
}

const UNREFRESHABLE = 'UNREFRESHABLE'

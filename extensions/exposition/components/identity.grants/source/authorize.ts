import { hold, identify } from './lib/index.js'
import type { Maybe, Operation } from '@toa.io/types'
import type { Context } from './lib/index.js'

/**
 * What the consent page calls when a user allows a client. The page holds the user's own
 * credentials, so this is the user's own route; the code it answers with is what the client
 * redeems at the token endpoint.
 *
 * The grant is recorded so a user can see what they allowed and take it back. It is not
 * consulted to skip the prompt — consent is asked every time, which is what keeps a client
 * that changed where it wants a code sent from being waved through on an older one.
 */
export class Effect implements Operation {
  private context!: Context

  public mount (context: Context): void {
    this.context = context
  }

  public async execute (input: Input): Promise<Maybe<Output>> {
    const { authority, identity } = input

    if (input.method !== S256)
      return invalid('invalid_request', 'Only the S256 code challenge method is supported')

    const client = await this.context.remote.identity.clients.describe({
      input: { authority, id: input.client, redirect: input.redirect }
    })

    if (client instanceof Error)
      return invalid('invalid_client', 'No such client')

    if (client.permitted !== true)
      return invalid('invalid_request', 'The redirect is not one this client may receive a code at')

    const scope = input.scope ?? []

    // recorded on the grant and carried to the token endpoint, and restricting nothing yet:
    // a token carries the rights of the identity that consented, over every path it may
    // reach. What binds it is a `permissions` argument in `exchange`, see documentation/oauth.md
    const resource = input.resource ?? []

    const grant = await this.context.local.transit({
      query: { id: identify(authority, identity, input.client) },
      input: { authority, identity, client: input.client, scope, resource }
    })

    if (grant instanceof Error)
      return grant

    const code = await hold(authority, {
      identity,
      client: input.client,
      redirect: input.redirect,
      challenge: input.challenge,
      scope,
      resource
    }, this.context)

    return { code, expires_in: this.context.configuration.lifetime }
  }
}

function invalid (error: string, description: string): Output {
  return { status: BAD_REQUEST, error, error_description: description }
}

const S256 = 'S256'
const BAD_REQUEST = 400

interface Input {
  authority: string
  identity: string
  client: string
  redirect: string
  challenge: string
  method: string
  scope?: string[]
  resource?: string[]
}

interface Output {
  status?: number
  code?: string
  expires_in?: number
  error?: string
  error_description?: string
}

import { ERR_UNKNOWN_CLIENT, permits, read } from './lib/index.js'
import type { Maybe } from '@toa.io/core/types'
import type { Operation } from '@toa.io/bridges.node'
import type { Client, Context } from './lib/index.js'

/**
 * What a client is, whichever way it came to be known: a `client_id` that is an https URL
 * publishes its own metadata, and anything else was registered here. The caller is not told
 * which, and neither mechanism is visible past this operation.
 *
 * Whether a redirect is one the client may receive a code at is answered here too. The rule
 * is this component's — nothing else knows a loopback port is ignored — and asking for it
 * with the client saves a second call on the path a person is waiting on.
 */
export class Computation implements Operation {
  private context!: Context

  public mount (context: Context): void {
    this.context = context
  }

  public async execute (input: Input): Promise<Maybe<Output>> {
    const client = input.id.startsWith(HTTPS)
      ? await read(input.id, this.context)
      : await this.registered(input)

    if (client instanceof Error)
      return client

    return {
      ...client,
      ...(input.redirect === undefined
        ? {}
        : { permitted: permits(client.redirect_uris, input.redirect) })
    }
  }

  private async registered (input: Input): Promise<Client | Error> {
    const entity = await this.context.local.observe({ query: { id: input.id } })

    // credentials are scoped to an authority, and so is what may act for them
    if (entity === null || entity.authority !== input.authority)
      return ERR_UNKNOWN_CLIENT

    return {
      client_id: entity.id,
      client_name: entity.name,
      client_uri: entity.uri,
      logo_uri: entity.logo,
      redirect_uris: entity.uris
    }
  }
}

const HTTPS = 'https://'

interface Input {
  authority: string
  id: string
  redirect?: string
}

interface Output extends Client {
  permitted?: boolean
}

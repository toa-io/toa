import { identify } from './lib/index.js'
import type { Maybe } from '@toa.io/core'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Metadata } from './lib/index.js'

/**
 * Dynamic Client Registration, RFC 7591: the client sends what it is and is given an
 * identifier for it. Unauthenticated, as the specification has it — a registration grants
 * nothing on its own, and stays inert until a user consents to the client on a page that
 * shows them its name and where it would send them.
 *
 * The identifier is a hash of the metadata, so registering the same thing twice is the
 * same client rather than another row. A client cannot remember it registered here.
 */
export class Effect implements Operation {
  private transit!: Context['local']['transit']
  private ttl!: number

  public mount (context: Context): void {
    this.transit = context.local.transit
    this.ttl = context.configuration.ttl
  }

  public async execute (input: Input): Promise<Maybe<Output>> {
    const { authority } = input

    if (input.token_endpoint_auth_method !== undefined &&
      input.token_endpoint_auth_method !== 'none')
      return invalid('invalid_client_metadata',
        'Only public clients are supported: token_endpoint_auth_method must be `none`')

    const uris = input.redirect_uris.map(normalize)

    for (const uri of uris)
      if (uri instanceof Error)
        return invalid('invalid_redirect_uri', uri.message)

    const metadata: Metadata = {
      client_name: input.client_name,
      client_uri: input.client_uri,
      logo_uri: input.logo_uri,
      scope: input.scope,
      redirect_uris: uris as string[]
    }

    const id = identify(authority, metadata)

    const entity = await this.transit({
      query: { id },
      input: {
        authority,
        name: metadata.client_name,
        uri: metadata.client_uri,
        logo: metadata.logo_uri,
        scope: metadata.scope,
        uris: metadata.redirect_uris,
        expires: Date.now() + this.ttl * 1000
      }
    })

    return {
      client_id: id,
      // of the record, not of this request: registering again answers what it answered
      client_id_issued_at: Math.floor((entity._created ?? Date.now()) / 1000),
      client_name: entity.name,
      client_uri: entity.uri,
      logo_uri: entity.logo,
      redirect_uris: entity.uris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none'
    }
  }
}

/** Absolute, no fragment, and either https or a loopback address (RFC 8252 §7.3). */
function normalize (value: string): string | Error {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return new Error(`\`${value}\` is not an absolute URI`)
  }

  if (url.hash !== '')
    return new Error(`\`${value}\` carries a fragment`)

  if (url.protocol === 'https:')
    return url.href

  if (url.protocol === 'http:' && LOOPBACK.has(url.hostname))
    return url.href

  return new Error(`\`${value}\` is neither https nor a loopback address`)
}

/** RFC 7591 §3.2.2: a registration error is a body, and `map:status` makes it the status. */
function invalid (error: string, description: string): Output {
  return { status: BAD_REQUEST, error, error_description: description }
}

const BAD_REQUEST = 400

const LOOPBACK = new Set(['127.0.0.1', '[::1]', 'localhost'])

interface Input extends Metadata {
  authority: string
}

interface Output {
  /** Read and removed by `map:status`; absent on a success, which answers 201. */
  status?: number
  client_id?: string
  client_id_issued_at?: number
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris?: string[]
  grant_types?: string[]
  response_types?: string[]
  token_endpoint_auth_method?: string
  error?: string
  error_description?: string
}

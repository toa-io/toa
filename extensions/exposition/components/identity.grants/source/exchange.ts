import { identify, spend, verifies } from './lib/index.js'
import type { Maybe } from '@toa.io/core/types'
import type { Operation } from '@toa.io/bridges.node'
import type { Code, Context } from './lib/index.js'

/**
 * The token endpoint, RFC 6749 §4.1.3. Anonymous, because the clients this server knows are
 * public ones with no secret to authenticate with: what stands in for that is PKCE, since
 * only the client that began the flow holds the verifier the challenge was made from.
 *
 * Every failure here is `invalid_grant` without saying which check failed. A code that was
 * replayed, a verifier that does not match and a redirect that was swapped are all the same
 * answer, and telling them apart would say whether a stolen code was still live.
 */
export class Effect implements Operation {
  private context!: Context

  public mount (context: Context): void {
    this.context = context
  }

  public async execute (input: Input): Promise<Maybe<Output>> {
    const { authority } = input

    if (input.grant_type !== AUTHORIZATION_CODE)
      return invalid('unsupported_grant_type', 'Only the authorization code grant is supported')

    if (input.code === undefined || input.code_verifier === undefined)
      return invalid('invalid_request', 'A code and a code verifier are required')

    // spent first: a wrong verifier burns the code, which is what stops it being guessed at
    const code = await spend(authority, input.code, this.context)

    if (code === null || !this.redeemable(code, input))
      return invalid('invalid_grant', 'The authorization code is not redeemable')

    // `permissions` would bind the token to `code.resource` — `{'/mcp/**': ['*']}` for a
    // resource at `/mcp/`, which `permits()` reads on every request. Left unset: the token
    // carries the rights of the identity that consented, see documentation/oauth.md#audience
    const issued = await this.context.remote.identity.tokens.issue({
      input: {
        authority,
        identity: code.identity,
        label: label(code.client),
        lifetime: this.context.configuration.token,
        ...(code.scope.length === 0 ? {} : { scopes: code.scope })
      }
    })

    // the only refusal `issue` makes is a scope the consenting identity does not hold, and
    // what it says about that is its own; the client is told what it may act on
    if (issued instanceof Error)
      return invalid('invalid_scope', 'The requested scope is not one the identity holds')

    // the key the token was issued under, so revoking the grant revokes the token. The token
    // is already out, so a grant that fails to record it is logged rather than unwound — it
    // costs the user the ability to revoke, and refusing here would cost them the token too
    const grant = await this.context.local.transit({
      query: { id: identify(authority, code.identity, code.client) },
      input: {
        authority,
        identity: code.identity,
        client: code.client,
        scope: code.scope,
        resource: code.resource,
        kid: issued.kid
      }
    })

    if (grant instanceof Error)
      this.context.logs.error('Grant not recorded for an issued token',
        { client: code.client, kid: issued.kid })

    return {
      // RFC 6749 §5.1 asks for 200, where a POST would otherwise answer 201
      status: OK,
      access_token: issued.token,
      token_type: 'Bearer',
      ...(issued.exp === undefined
        ? {}
        : { expires_in: Math.floor((issued.exp - Date.now()) / 1000) }),
      ...(code.scope.length === 0 ? {} : { scope: code.scope.join(' ') })
    }
  }

  private redeemable (code: Code, input: Input): boolean {
    if (!verifies(code.challenge, input.code_verifier!))
      return false

    // RFC 6749 §4.1.3: what was sent to `authorize` must be sent again
    if (input.redirect_uri !== undefined && input.redirect_uri !== code.redirect)
      return false

    return input.client_id === undefined || input.client_id === code.client
  }
}

/** `identity.tokens` requires one, and it is what a user sees when listing what they issued. */
function label (client: string): string {
  return client.slice(0, LABEL)
}

function invalid (error: string, description: string): Output {
  return { status: BAD_REQUEST, error, error_description: description }
}

const AUTHORIZATION_CODE = 'authorization_code'
const OK = 200
const BAD_REQUEST = 400
const LABEL = 64

interface Input {
  authority: string
  grant_type: string
  code?: string
  code_verifier?: string
  redirect_uri?: string
  client_id?: string
  resource?: string | string[]
}

interface Output {
  status?: number
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

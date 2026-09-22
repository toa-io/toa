import type { OAuth } from '@toa.io/definitions/extensions.exposition'

/** The discovery documents of one authority, and the challenge that points at them. */
export interface Documents {
  /** The document a path names, or nothing when it names none. */
  read: (pathname: string) => object | undefined

  /** `WWW-Authenticate` for a request to this path, which names the resource it failed at. */
  challenge: (pathname: string) => string
}

export function documents(issuer: string, oauth: OAuth): Documents {
  const server = authorizationServer(issuer, oauth)
  const resources = protectedResources(issuer, oauth)
  const scope = scoped(oauth)

  function read(pathname: string): object | undefined {
    if (pathname === AUTHORIZATION_SERVER || pathname === OPENID_CONFIGURATION)
      return server

    if (pathname.startsWith(PROTECTED_RESOURCE))
      return resources.get(pathname.slice(PROTECTED_RESOURCE.length))

    return undefined
  }

  function challenge(pathname: string): string {
    return `Bearer resource_metadata="${issuer}${PROTECTED_RESOURCE}${suffix(oauth, pathname)}"${scope}`
  }

  return { read, challenge }
}

/**
 * A host that is one resource and nothing else: MCP served at its root. The resource is the
 * origin, and the authorization server is the authority's issuer — which is not this origin,
 * so no authorization server metadata is served here: a client that compares an issuer to
 * where it read it is right to refuse a document naming someone else.
 */
export function alias(origin: string, issuer: string, oauth: OAuth): Documents {
  const document = resource(origin, issuer, oauth)
  const metadata = `${origin}${PROTECTED_RESOURCE}`
  const scope = scoped(oauth)

  return {
    read: (pathname: string) => (pathname === PROTECTED_RESOURCE ? document : undefined),
    challenge: () => `Bearer resource_metadata="${metadata}"${scope}`
  }
}

function scoped(oauth: OAuth): string {
  return oauth.scopes === undefined ? '' : `, scope="${oauth.scopes.join(' ')}"`
}

/**
 * RFC 8414. `authorization_endpoint` is the application's own page and may be anywhere;
 * everything else this extension serves. Both flags are load-bearing for a client that
 * prefers Client ID Metadata Documents: without either it falls back to registration.
 */
function authorizationServer(issuer: string, oauth: OAuth): object {
  const metadata: Record<string, unknown> = {
    issuer,
    authorization_endpoint: oauth.authorize,
    token_endpoint: `${issuer}${TOKEN}`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true
  }

  if (oauth.registration === 'open')
    metadata.registration_endpoint = `${issuer}${REGISTRATION}`

  if (oauth.scopes !== undefined) metadata.scopes_supported = oauth.scopes

  return metadata
}

/**
 * RFC 9728, keyed by the path the well-known segment is followed by: a client resolving
 * `https://host/mcp` reads `/.well-known/oauth-protected-resource/mcp`, and one that names
 * no path reads the document at the origin.
 */
function protectedResources(issuer: string, oauth: OAuth): Map<string, object> {
  const map = new Map<string, object>()

  for (const path of oauth.resources ?? [])
    map.set(canonical(path), resource(issuer + canonical(path), issuer, oauth))

  map.set('', resource(issuer, issuer, oauth))

  return map
}

/** The URI the resource is identified by, and the issuer that authorizes it. */
function resource(uri: string, issuer: string, oauth: OAuth): object {
  const metadata: Record<string, unknown> = {
    resource: uri,
    authorization_servers: [issuer],
    bearer_methods_supported: ['header']
  }

  if (oauth.scopes !== undefined) metadata.scopes_supported = oauth.scopes

  return metadata
}

/** The document a request to this path was refused against: the longest resource holding it. */
function suffix(oauth: OAuth, pathname: string): string {
  let longest = ''

  for (const path of oauth.resources ?? [])
    if (pathname.startsWith(path) && path.length > longest.length) longest = path

  return canonical(longest)
}

/**
 * A resource is identified without its trailing slash — the form MCP asks for — while a
 * route is declared with one, so `/mcp/` identifies `…/mcp`.
 */
function canonical(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path
}

const AUTHORIZATION_SERVER = '/.well-known/oauth-authorization-server'
const PROTECTED_RESOURCE = '/.well-known/oauth-protected-resource'
const OPENID_CONFIGURATION = '/.well-known/openid-configuration'
const TOKEN = '/identity/grants/'
const REGISTRATION = '/identity/clients/'

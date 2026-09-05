import { console } from 'openspan'
import { BRANCH_TTL } from '../const.js'
import * as http from '../HTTP/index.js'
import { discovery, type Discovery } from './discover.js'
import { call, list, type Scope } from './tools.js'
import {
  HEADER_MISMATCH,
  INVALID_PARAMS,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  PARSE,
  UNSUPPORTED_VERSION,
  failure,
  response
} from './errors.js'
import {
  CLIENT_CAPABILITIES,
  JSONRPC,
  LEGACY,
  MODERN,
  PROTOCOL_VERSION,
  SERVER_INFO,
  VERSIONS,
  type Cache,
  type Message,
  type Params
} from './types.js'
import type { Tree } from '../RTD/index.js'
import type { MCP } from '../Annotation.js'

/**
 * The Model Context Protocol, as one endpoint that remembers nothing between requests.
 *
 * Two revisions are answered from it. The modern one carries the version and the client's
 * capabilities in every request; the one before it opens with `initialize`, which is what
 * most clients still send. Neither needs a session, and neither needs a stream: every method
 * here answers one object, which is why this can exist in a package that serves no SSE.
 */
export class Server {
  private readonly options: MCP
  private readonly tree: Tree
  private readonly discovery: Discovery
  private readonly origins: Set<string>

  public constructor (options: MCP, tree: Tree) {
    this.options = options
    this.tree = tree
    this.discovery = discovery(options)
    this.origins = new Set(options.origins ?? [])
  }

  public async process (context: http.Context,
    route: http.Processor): Promise<http.OutgoingMessage> {
    if (context.request.method !== 'POST')
      throw new http.MethodNotAllowed(new Headers({ allow: 'POST' }))

    this.admit(context)

    const message = await this.read(context)
    const version = this.version(context, message)
    const modern = version === MODERN

    if (modern)
      this.mirrored(context, message)

    const result = await this.answer({ context, route, tree: this.tree }, message, modern)

    // a notification is answered by not answering, and there is nothing here to remember
    if (message.id === undefined)
      return { status: ACCEPTED }

    return {
      status: OK,
      body: { jsonrpc: JSONRPC, id: message.id, result },
      headers: new Headers({ 'cache-control': 'no-store' })
    }
  }

  /** Who may reach the endpoint at all, before anything it carries is read. */
  private admit (context: http.Context): void {
    const origin = context.request.headers.origin

    // the revision requires this against DNS rebinding; a request without one is no browser's
    if (origin !== undefined && !this.origins.has(origin))
      throw new http.Forbidden('Origin is not allowed')

    if (this.options.anonymous === true)
      return

    if ((context as { identity?: unknown }).identity == null)
      throw new http.Unauthorized()

    // the scopes an operation needs are its own, so the challenge names the failure and no more
    context.pipelines.response.push((message) => {
      if (message.status !== FORBIDDEN)
        return

      message.headers ??= new Headers()
      message.headers.set('www-authenticate', 'Bearer error="insufficient_scope"')
    })
  }

  private async answer (scope: Scope, message: Message, modern: boolean): Promise<unknown> {
    const params = message.params ?? {}

    switch (message.method) {
      case 'server/discover':
        return this.complete(this.discovery.modern, modern, DISCOVERY_CACHE)

      case 'tools/list':
        return this.complete({ tools: await list(this.tree, scope.context) }, modern, TOOLS_CACHE)

      case 'tools/call':
        return this.complete(await this.tool(scope, params), modern)

      // what a client of an earlier revision opens with; no session is made and none is named
      case 'initialize':
        return this.discovery.legacy(declared(params))

      case 'notifications/initialized':
        return null

      case 'ping':
        return {}

      default:
        throw new http.NotFound(response(message.id ?? null,
          failure(METHOD_NOT_FOUND, `'${message.method}' is not a method this server answers`)))
    }
  }

  private async tool (scope: Scope, params: Params): Promise<object> {
    const named = params.name

    if (typeof named !== 'string')
      throw new http.BadRequest(response(null,
        failure(INVALID_PARAMS, '`tools/call` states the tool it calls by name')))

    const args = params.arguments ?? {}

    if (typeof args !== 'object' || args === null || Array.isArray(args))
      throw new http.BadRequest(response(null,
        failure(INVALID_PARAMS, '`arguments` must be an object')))

    return await console.span({ name: named },
      async () => await call(scope, named, args as Params))
  }

  /**
   * Every result of the modern revision says what kind it is, and who answered it. Where the
   * revision names the operation as one whose result may be held, it says that too, and must.
   */
  private complete (result: object, modern: boolean, cache?: Cache): object {
    return modern
      ? { ...result, ...cache, resultType: 'complete', _meta: { [SERVER_INFO]: this.serverInfo() } }
      : result
  }

  private serverInfo (): unknown {
    return (this.discovery.modern as { _meta: Record<string, unknown> })._meta[SERVER_INFO]
  }

  /**
   * Which revision this request is of. `initialize` is one by itself; otherwise the header
   * says, and a request that names none is of a revision that did not send one.
   */
  private version (context: http.Context, message: Message): string {
    if (message.method === 'initialize')
      return LEGACY

    const header = context.request.headers['mcp-protocol-version']
    const stated = declared(message.params ?? {})

    if (header !== undefined && stated !== undefined && header !== stated)
      throw new http.BadRequest(response(message.id ?? null, failure(HEADER_MISMATCH,
        `'MCP-Protocol-Version' says '${String(header)}' and the body says '${stated}'`)))

    const value = (header as string | undefined) ?? stated

    if (value === undefined)
      return LEGACY

    if (!VERSIONS.includes(value))
      throw new http.BadRequest(response(message.id ?? null,
        failure(UNSUPPORTED_VERSION, 'Unsupported protocol version',
          { supported: VERSIONS, requested: value })))

    return value
  }

  /**
   * What the modern revision mirrors into headers, so that what routes a request and what
   * answers it cannot be told two different things.
   */
  private mirrored (context: http.Context, message: Message): void {
    const meta = metadata(message.params ?? {})

    if (meta?.[PROTOCOL_VERSION] === undefined || meta[CLIENT_CAPABILITIES] === undefined)
      throw new http.BadRequest(response(message.id ?? null, failure(INVALID_PARAMS,
        `'_meta' states '${PROTOCOL_VERSION}' and '${CLIENT_CAPABILITIES}'`)))

    const id = message.id ?? null

    mirrors(context, { id, header: 'mcp-method', value: message.method })

    if (message.method === 'tools/call')
      mirrors(context, { id, header: 'mcp-name', value: (message.params ?? {}).name })
  }

  /** A body the decoder refuses is a parse error; a media type it does not know is not. */
  private async read (context: http.Context): Promise<Message> {
    let body: unknown

    try {
      body = await context.body()
    } catch (exception) {
      if (exception instanceof http.BadRequest)
        throw new http.BadRequest(response(null, failure(PARSE, 'Parse error')))

      throw exception
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body) ||
      (body as Message).jsonrpc !== JSONRPC || typeof (body as Message).method !== 'string')
      throw new http.BadRequest(response(null,
        failure(INVALID_REQUEST, 'A request carries one JSON-RPC message')))

    return body as Message
  }
}

/** What a header says must be what the body says, or what routes and what answers differ. */
function mirrors (context: http.Context, mirror: Mirror): void {
  const { id, header, value } = mirror
  const stated = context.request.headers[header]

  if (stated === undefined)
    throw new http.BadRequest(response(id, failure(HEADER_MISMATCH, `'${header}' is required`)))

  if (decode(String(stated)) !== value)
    throw new http.BadRequest(response(id, failure(HEADER_MISMATCH,
      `'${header}' says '${String(stated)}' and the body says '${String(value)}'`)))
}

interface Mirror {
  id: string | number | null
  header: string
  value: unknown
}

function metadata (params: Params): Record<string, unknown> | undefined {
  const meta = params._meta

  return typeof meta === 'object' && meta !== null
    ? meta as Record<string, unknown>
    : undefined
}

function declared (params: Params): string | undefined {
  const stated = metadata(params)?.[PROTOCOL_VERSION]

  return typeof stated === 'string' ? stated : undefined
}

/** What a header value that could not be written as ASCII was encoded as. */
function decode (value: string): string {
  if (!value.startsWith(SENTINEL) || !value.endsWith(TERMINATOR))
    return value

  const encoded = value.slice(SENTINEL.length, -TERMINATOR.length)

  return Buffer.from(encoded, 'base64').toString('utf8')
}

/** A tool list is what the tree holds, which stands until a branch of it expires. */
const TOOLS_CACHE: Cache = { ttlMs: BRANCH_TTL, cacheScope: 'private' }

/** What the annotation says, which is the same for every caller until the application is redeployed. */
const DISCOVERY_CACHE: Cache = { ttlMs: BRANCH_TTL, cacheScope: 'public' }

const OK = 200
const ACCEPTED = 202
const FORBIDDEN = 403
const SENTINEL = '=?base64?'
const TERMINATOR = '?='

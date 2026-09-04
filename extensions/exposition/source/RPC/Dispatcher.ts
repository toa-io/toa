import { console } from 'openspan'
import * as http from '../HTTP/index.js'
import * as schemas from '../schemas.js'
import { address } from './names.js'
import { fork } from './Context.js'
import { INVALID_REQUEST, PARSE, failure, of, response } from './errors.js'
import { QUERY, VERSION, type Call, type Params, type Response } from './types.js'

/**
 * JSON-RPC, as the calls a request carries.
 *
 * It clones the context per call and hands each clone back to the gateway: it holds no
 * tree, no index and no knowledge of routing. Whether a name resolves, what it resolves
 * to, and what the directives of that route do are answered by the same `route` an
 * ordinary request goes through.
 */
export class Dispatcher {
  public async dispatch (context: http.Context,
    route: http.Processor): Promise<http.OutgoingMessage> {
    if (context.request.method !== 'POST')
      throw new http.MethodNotAllowed(new Headers({ allow: 'POST' }))

    const envelope = await this.read(context)

    // Stage 3
    if (Array.isArray(envelope))
      throw new http.BadRequest(response(null, failure(INVALID_REQUEST, 'A batch is not supported')))

    const error = schemas.call.fit(envelope)

    if (error !== null)
      throw new http.BadRequest(response(null, failure(INVALID_REQUEST, error.message)))

    const answer = await this.call(envelope as Call, context, route)

    if (answer === null)
      return { status: NO_CONTENT }

    // a reply assembled from several is not one of them, and is not stored as if it were
    return {
      status: OK,
      body: answer,
      headers: new Headers({ 'cache-control': 'no-store' })
    }
  }

  private async call (call: Call, context: http.Context,
    route: http.Processor): Promise<Response | null> {
    const notification = call.id === undefined

    try {
      const params = call.params ?? {}
      const { path, verb, variables } = address(call.method, params)
      const { query, input } = split(params, variables)
      const clone = fork(context, path, verb, query, input)
      const message = await route(clone)

      // what `io:output` restricts, over this call's reply rather than the envelope
      await http.shape(clone, message)

      if (notification)
        return null

      return { jsonrpc: VERSION, id: call.id!, result: message.body ?? null }
    } catch (exception) {
      /*
       * A credential belongs to the request. Refusing one call for it would leave the
       * reply a 200, and the challenge that tells a client where to authenticate is
       * attached to a 401 — so the whole envelope is refused instead.
       */
      if (exception instanceof http.Unauthorized)
        throw exception

      if (notification) {
        console.debug('Notification failed', { method: call.method, error: of(exception) })

        return null
      }

      return { jsonrpc: VERSION, id: call.id!, error: of(exception) }
    }
  }

  /** A body the decoder refuses is a parse error; a media type it does not know is not. */
  private async read (context: http.Context): Promise<unknown> {
    try {
      return await context.body()
    } catch (exception) {
      if (exception instanceof http.BadRequest)
        throw new http.BadRequest(response(null, failure(PARSE, 'Parse error')))

      throw exception
    }
  }
}

/**
 * What the call carries, as a request carries it: the path took its variables, `query`
 * is the querystring, and the rest is the body.
 */
function split (params: Params, variables: string[]): { query?: Params, input?: Params } {
  const input: Params = {}
  let query: Params | undefined

  for (const [name, value] of Object.entries(params)) {
    if (variables.includes(name))
      continue

    if (name !== QUERY) {
      input[name] = value

      continue
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new http.BadRequest(`'${QUERY}' must be an object`)

    query = value as Params
  }

  // an absent body is what a request without one has, and the mapping fills it as it does
  return { query, input: Object.keys(input).length === 0 ? undefined : input }
}

const OK = 200
const NO_CONTENT = 204

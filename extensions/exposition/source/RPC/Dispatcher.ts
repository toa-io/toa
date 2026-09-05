import { console } from 'openspan'
import * as http from '../HTTP/index.js'
import * as schemas from '../schemas.js'
import { BATCH } from '../const.js'
import { address, split } from './names.js'
import { fork } from './Context.js'
import { BATCH_TOO_LARGE, INVALID_REQUEST, PARSE, failure, of, response } from './errors.js'
import { VERSION, type Call, type Response } from './types.js'
import type { RPC } from '../Annotation.js'

/**
 * JSON-RPC, as the calls a request carries.
 *
 * It clones the context per call and hands each clone back to the gateway: it holds no
 * tree, no index and no knowledge of routing. Whether a name resolves, what it resolves
 * to, and what the directives of that route do are answered by the same `route` an
 * ordinary request goes through.
 */
export class Dispatcher {
  private readonly batch: number

  public constructor (options: RPC) {
    this.batch = options.batch ?? BATCH
  }

  public async dispatch (context: http.Context,
    route: http.Processor): Promise<http.OutgoingMessage> {
    if (context.request.method !== 'POST')
      throw new http.MethodNotAllowed(new Headers({ allow: 'POST' }))

    const envelope = await this.read(context)
    const batched = Array.isArray(envelope)
    const calls = batched ? envelope : [envelope]

    if (calls.length === 0)
      throw new http.BadRequest(response(null,
        failure(INVALID_REQUEST, 'A request carries at least one call')))

    if (calls.length > this.batch)
      throw new http.BadRequest(response(null,
        failure(BATCH_TOO_LARGE, `A request carries at most ${this.batch} calls`)))

    const answers: Response[] = []

    // one after another: a request the caller writes should not become a fan-out they own
    for (const call of calls) {
      const answer = await this.answer(call, context, route)

      if (answer !== null)
        answers.push(answer)
    }

    // every call was a notification, and a notification is answered by not answering
    if (answers.length === 0)
      return { status: NO_CONTENT }

    // a reply assembled from several is not one of them, and is not stored as if it were
    return {
      status: OK,
      body: batched ? answers : answers[0],
      headers: new Headers({ 'cache-control': 'no-store' })
    }
  }

  private async answer (input: unknown, context: http.Context,
    route: http.Processor): Promise<Response | null> {
    const invalid = schemas.call.fit(input)

    // it may have carried an id, but nothing about it is trustworthy enough to answer to
    if (invalid !== null)
      return response(null, failure(INVALID_REQUEST, invalid.message))

    return await this.call(input as Call, context, route)
  }

  private async call (call: Call, context: http.Context,
    route: http.Processor): Promise<Response | null> {
    const notification = call.id === undefined

    try {
      const params = call.params ?? {}
      const { path, verb, variables } = address(call.method, params)
      const { query, input } = split(params, variables)
      const clone = fork(context, path, verb, query, input)

      // one span per call, so what the directives of that call open has somewhere to hang
      const message = await console.span({ name: call.method, attributes: { id: call.id } },
        async () => await route(clone))

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

const OK = 200
const NO_CONTENT = 204

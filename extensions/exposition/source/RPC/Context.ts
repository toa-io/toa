import * as http from '../HTTP/index.js'
import { Timing } from '../HTTP/Timing.js'
import type { Params } from './types.js'

/**
 * One call, as a request the rest of the gateway can serve.
 *
 * The clone is the transport context except for what the call decides, so nothing
 * downstream — the router, the directives, the endpoint, the mapping — knows it is one.
 * It is derived from the context rather than built beside it, so everything not named
 * here, `identity` included, is read through.
 */
// eslint-disable-next-line max-params
export function fork (context: http.Context, path: string, verb: string,
  query: Params | undefined, input: unknown): http.Context {
  const url = new URL(path, context.url)

  if (query !== undefined)
    for (const [name, value] of Object.entries(query))
      url.searchParams.set(name, String(value))

  const headers = { ...context.request.headers }

  // a conditional is the envelope's, and a call would answer 304 to a question nobody asked
  delete headers['if-match']
  delete headers['if-none-match']

  const request = Object.create(context.request, {
    method: { value: verb, enumerable: true },
    headers: { value: headers, enumerable: true }
  })

  // its own, so an `io:output` restriction shapes this call's reply and no other
  const pipelines: Pipelines = { body: [], response: [] }

  return Object.create(context, {
    /*
     * A credential refuses an `anonymous` route because it would make the reply
     * uncacheable. What a procedure answers is not a reply: it is a value in an envelope
     * this gateway answers `no-store`, and the procedure's own headers are discarded.
     */
    procedural: { value: true, enumerable: true },
    url: { value: url, enumerable: true },
    request: { value: request, enumerable: true },
    pipelines: { value: pipelines, enumerable: true },
    /*
     * Its own, so that what the stages of a call take is measured per call and stays there.
     * `server-timing` is a header, and a request carrying thirty-two calls would otherwise
     * write ninety-six values into one — where a trace says the same thing, per call.
     */
    timing: { value: new Timing(), enumerable: true },
    body: {
      value: async () => {
        let value = input

        for (const transform of pipelines.body)
          value = await transform(value)

        return value
      }
    },
    /*
     * The raw request is the envelope, and it has been read. `map:buffer` is the one
     * directive that asks for it, and answering with a spent stream would hand the
     * operation an empty string; refusing says what is actually the matter.
     */
    buffer: {
      value: () => {
        throw new http.BadRequest('`map:buffer` reads the request, which a call is not')
      }
    }
  }) as http.Context
}

interface Pipelines {
  body: Array<(input: unknown) => unknown>
  response: Array<(output: http.OutgoingMessage) => void | Promise<void>>
}

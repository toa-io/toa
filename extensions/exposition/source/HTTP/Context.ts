import crypto from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import Negotiator from 'negotiator'
import { console } from 'openspan'
import { Timing } from './Timing'
import { type Format, formats, types } from './formats'
import { read } from './messages'
import type { OutgoingMessage } from './messages'
import type * as http from 'node:http'

export class Context {
  public readonly id: string
  public readonly authority: string
  public readonly request: IncomingMessage
  public readonly url: URL
  public readonly subtype: string | null = null
  public readonly encoder: Format | null = null
  public readonly timing: Timing
  public readonly debug: boolean

  public readonly pipelines: Pipelines = {
    body: [],
    response: []
  }

  private consumed = false

  // eslint-disable-next-line max-params
  public constructor (authority: string, request: IncomingMessage, properties: Properties,
    url: URL) {
    this.authority = authority
    this.request = request

    this.id = crypto.randomUUID()
    // parsed by the server, which had to parse it anyway to know the request is valid
    this.url = url
    this.timing = new Timing()
    this.debug = properties.debug
    this.log(request)

    const accept = this.request.headers.accept

    if (accept !== undefined) {
      const match = SUBTYPE.exec(accept)

      if (match !== null) {
        const {
          type,
          subtype,
          suffix
        } = match.groups!

        this.request.headers.accept = `${type}/${suffix}`
        this.subtype = subtype
      }
    }

    const encoder = negotiate(this.request)

    if (encoder !== undefined)
      this.encoder = encoder
  }

  public async buffer (): Promise<Buffer> {
    this.consumed = true

    return await buffer(this.request)
  }

  public async body<T>(): Promise<T> {
    let value = this.consumed ? null : await read(this)

    for (const transform of this.pipelines.body)
      value = await transform(value)

    return value
  }

  private log (request: IncomingMessage): void {
    const headers = { ...request.headers }

    if (headers.authorization !== undefined)
      // only scheme
      headers.authorization = headers.authorization.slice(0, headers.authorization.indexOf(' '))

    console.debug('Received request', { method: request.method, url: request.url, headers })
  }
}

export interface IncomingMessage extends http.IncomingMessage {
  url: string
  method: string
}

interface Pipelines {
  body: Array<(input: unknown) => unknown>
  response: Array<(output: OutgoingMessage) => void | Promise<void>>
}

interface Properties {
  debug: boolean
}

/**
 * Negotiation parses the header and sorts the candidates, and the value repeats:
 * clients send one of a handful of `accept` strings. Bounded, the header is theirs.
 */
function negotiate (request: IncomingMessage): Format | undefined {
  const accept = request.headers.accept ?? ''
  const known = NEGOTIATED.get(accept)

  if (known !== undefined)
    return known === NONE ? undefined : known

  const mediaType = new Negotiator(request).mediaType(types)
  const encoder = mediaType === undefined ? undefined : formats[mediaType]

  if (NEGOTIATED.size >= NEGOTIATED_LIMIT)
    NEGOTIATED.clear()

  NEGOTIATED.set(accept, encoder ?? NONE)

  return encoder
}

/** distinguishes "negotiated to nothing" from "not negotiated yet" */
const NONE = Symbol('not acceptable') as unknown as Format
const NEGOTIATED = new Map<string, Format>()
const NEGOTIATED_LIMIT = 1024

const SUBTYPE = /^(?<type>\w{1,32})\/(vnd\.toa\.(?<subtype>\S{1,32})\+)(?<suffix>\S{1,32})$/

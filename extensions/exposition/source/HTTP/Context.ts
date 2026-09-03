import crypto from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import Negotiator from 'negotiator'
import { console } from 'openspan'
import { Timing } from './Timing.js'
import { type Format, formats, types } from './formats/index.js'
import { read } from './messages.js'
import { address } from './address.js'
import type { OutgoingMessage } from './messages.js'
import type { IncomingMessage } from './types.js'

export class Context {
  public readonly id: string
  public readonly authority: string
  public readonly request: IncomingMessage

  /** the client address, read as the deployment says; none otherwise, see `documentation/ip.md` */
  public readonly ip: string | undefined
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
    this.ip = address(request, properties.ip)

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
      headers.authorization = SCHEME.exec(headers.authorization)?.[1] ?? '[malformed]'

    console.debug('Received request', { method: request.method, url: request.url, headers })
  }
}

/** The scheme of an `authorization` header; the value after it is a credential. */
const SCHEME = /^(\w{1,32})(?: |$)/

interface Pipelines {
  body: Array<(input: unknown) => unknown>
  response: Array<(output: OutgoingMessage) => void | Promise<void>>
}

interface Properties {
  debug: boolean

  /** the header the client address is read from; the connection's without one */
  ip?: string
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

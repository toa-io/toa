import * as http from 'node:http'
import * as https from 'node:https'
import * as http2 from 'node:http2'
import * as assert from 'node:assert'
import { once } from 'node:events'
import { buffer } from 'node:stream/consumers'
import { trim } from '@toa.io/generic'
import * as undici from 'undici'
import { meros } from 'meros/node'
import * as protocol from './index.js'
import { dispatcher, parse, request } from './request.js'
import { PROTOCOL } from './protocol.js'
import * as parser from './parse/index.js'
import { Captures } from './Captures.js'
import type { Readable } from 'stream'
import type { HTTPRequest } from './parse/request.js'

/*
It is extracted from the Exposition.
Use its features to test.

/extensions/exposition/features/identity.feature
 */

export class Agent {
  public readonly origin?: string
  public response: string = ''

  /** The last response body, as received. A binary body does not survive `response`. */
  public bytes: Buffer | null = null
  public readonly captures: Captures
  public pending = new Set<Readable & { destroy: () => void }>()

  public constructor (origin?: string, captures: Captures = new Captures()) {
    this.origin = origin
    this.captures = captures
  }

  public async fetch (input: string, options: Partial<undici.Dispatcher.RequestOptions> = {}): Promise<undici.Dispatcher.ResponseData> {
    const message = this.normalize(input)

    return await request(message, { ...options, base: this.origin })
  }

  public async request (input: string): Promise<any> {
    const response = await this.fetch(input)

    this.bytes = Buffer.from(await response.body.arrayBuffer())
    this.response = await parser.response(response, this.bytes.toString())
  }

  public async parts (input: string): Promise<ReturnType<typeof meros>> {
    const message = this.normalize(input)
    const req = parse(message, this.origin)

    const headers: Record<string, string> = {}

    for (const [key, value] of req.headers)
      headers[key] = value

    const { stream, status } = PROTOCOL === 'h2c'
      ? await this.h2c(req, headers)
      : await this.h1(req, headers)

    if (status !== 200 && status !== 201) {
      stream.destroy()

      assert.fail(`Request failed with status ${status}: ${req.url}`)
    }

    this.pending.add(stream)
    stream.on('end', () => this.pending.delete(stream))
    stream.on('error', () => this.pending.delete(stream))

    return await meros(stream as unknown as http.IncomingMessage)
  }

  public abort (): void {
    for (const response of this.pending)
      response.destroy()

    this.pending.clear()
  }

  public responseIncludes (expected: string): void {
    const line = this.mismatch(this.response, expected)

    if (line !== null)
      throw new assert.AssertionError({
        message: `Response is missing '${line}'`,
        expected: line,
        actual: this.response.slice(0, MAX_DIFF_LENGTH)
      })
  }

  public mismatch (sample: string, reference: string): string | null {
    const lines = trim(reference).split('\n')
    let rest = sample

    for (const line of lines) {
      if (line.trim() === '') continue

      const match = this.captures.capture(rest, line)

      if (match === null)
        return line

      rest = rest.slice(match.end)
    }

    return null
  }

  public responseExcludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const substituted = this.captures.substitute(line)

      if (this.response.includes(substituted))
        throw new assert.AssertionError({
          message: `Response contains '${line}'`,
          expected: line,
          actual: this.response.slice(0, MAX_DIFF_LENGTH)
        })
    }
  }

  public async stream (head: string, stream: Readable): Promise<any> {
    head = trim(head) + '\n\n'
    head = this.captures.substitute(head)

    const {
      url,
      method,
      headers
    } = protocol.parse.request(head)

    const href = new URL(url, this.origin).href

    // Over h2c a refused upload is answered and then RST_STREAM(NO_ERROR)'d, which destroys
    // the body we were sending. Unhandled, that `'error'` would throw. It is not a failure on
    // its own: a real one either shows in the reply or makes `undici.request` reject.
    stream.on('error', () => undefined)

    const options = {
      method,
      headers,
      body: stream,
      dispatcher: dispatcher(new URL(href).origin)
    }

    try {
      const response = await undici.request(href, options)

      this.response = await protocol.parse.response(response)
    } catch (e: any) {
      console.error(e)
      console.error(e.cause)

      throw e
    }
  }

  public async streamMatch (head: string, stream: Readable): Promise<any> {
    const buf = await buffer(stream)
    const text = buf.toString('utf8')
    const expected = head + '\n\n' + text

    this.responseIncludes(expected)
  }

  private async h1 (req: HTTPRequest, headers: Record<string, string>): Promise<Reply> {
    const transport = new URL(req.url).protocol === 'https:' ? https : http

    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const request = transport.request(req.url, {
        method: req.method,
        headers
      }, (response) => resolve(response))

      request.on('error', reject)
      request.end(req.body)
    })

    return { stream: response, status: response.statusCode }
  }

  private async h2c (req: HTTPRequest, headers: Record<string, string>): Promise<Reply> {
    const url = new URL(req.url)

    // HTTP/2 carries the authority as a pseudo-header; `host` alongside it is forbidden
    const { host, ...rest } = headers
    const session = http2.connect(url.origin)

    session.on('error', () => undefined)

    const stream = session.request({
      ...rest,
      [http2.constants.HTTP2_HEADER_METHOD]: req.method,
      [http2.constants.HTTP2_HEADER_PATH]: url.pathname + url.search,
      [http2.constants.HTTP2_HEADER_AUTHORITY]: host ?? url.host
    })

    stream.end(req.body)

    const [reply] = await once(stream, 'response') as [http2.IncomingHttpHeaders]

    // `meros` reads the boundary off `.headers`, which a client stream does not carry
    Object.assign(stream, { headers: reply })

    // the session exists for this one stream; nothing else keeps the process from exiting
    stream.on('close', () => session.close())

    return { stream, status: reply[http2.constants.HTTP2_HEADER_STATUS] as unknown as number }
  }

  private normalize (input: string): string {
    const substituted = this.captures.substitute(input)
    let [headers, body] = trim(substituted).split('\n\n')

    // a request that states its own length is testing that length, and appending
    // a second header would make the client reject it before it is ever sent
    if (body !== undefined && !DECLARES_LENGTH.test(headers))
      headers += '\ncontent-length: ' + Buffer.byteLength(body)

    return headers + '\n\n' + (body ?? '')
  }
}

const MAX_DIFF_LENGTH = 4096

const DECLARES_LENGTH = /^content-length:/im

interface Reply {
  stream: Readable & { destroy: () => void }
  status: number | undefined
}

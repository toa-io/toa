import fs from 'node:fs'
import os from 'node:os'
import * as http from 'node:http'
import assert from 'node:assert'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import Negotiator from 'negotiator'
import { read, write, type IncomingMessage, type OutgoingMessage } from './messages'
import { ClientError, Exception } from './exceptions'
import { formats, types } from './formats'
import { Timing } from './Timing'

export class Server extends Connector {
  private readonly server: http.Server = http.createServer()
  private readonly properties: Properties
  private process?: Processing

  private constructor (properties: Properties) {
    super()

    this.properties = properties

    this.server.on('request', (req, res) => this.listener(req, res))
  }

  public get port (): number {
    if (this.properties.port !== 0)
      return this.properties.port

    const address = this.server.address()

    if (address === null || typeof address === 'string')
      throw new Error('Server is not listening on a port.')

    return address.port
  }

  public static create (options?: Partial<Properties>): Server {
    const properties = options === undefined
      ? DEFAULTS
      : { ...DEFAULTS, ...options }

    return new Server(properties)
  }

  public attach (process: Processing): void {
    this.process = process
  }

  protected override async open (): Promise<void> {
    const listening = promex()

    this.server.listen(this.properties.port, listening.callback)

    await listening

    console.info('HTTP Server is listening.')
  }

  protected override async close (): Promise<void> {
    const stopped = promex()

    this.server.close(stopped.callback)

    console.info('HTTP Server stopped accepting new connections.')

    await stopped

    console.info('HTTP Server has been stopped.')
  }

  private listener (request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.method === undefined || !this.properties.methods.has(request.method)) {
      response.writeHead(501).end()

      return
    }

    if (request.url === undefined) {
      response.writeHead(400).end()

      return
    }

    assert.ok(this.process !== undefined,
      'No processing function has been attached to the server.')

    this.extend(request)

    this.process(request)
      .then(this.success(request, response))
      .catch(this.fail(request, response))
  }

  private extend (request: http.IncomingMessage): asserts request is IncomingMessage {
    const message = request as IncomingMessage

    message.locator = new URL(message.url, `https://${request.headers.host}`)
    message.pipelines = { body: [], response: [] }
    message.timing = new Timing(this.properties.trace)

    negotiate(request, message)

    message.parse = async <T> (): Promise<T> => {
      const value = await read(message)

      if (message.pipelines.body.length === 0)
        return value

      return message.pipelines.body.reduce((value, transform) => transform(value), value)
    }
  }

  private success (request: IncomingMessage, response: http.ServerResponse) {
    return (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null) status = 404
        else if (request.method === 'POST') status = 201
        else if (message.body === undefined) status = 204
        else status = 200

      response.statusCode = status
      write(request, response, message)
    }
  }

  private fail (request: IncomingMessage, response: http.ServerResponse) {
    return async (exception: Error) => {
      if (!request.complete)
        await adam(request)

      const status = exception instanceof Exception
        ? exception.status
        : 500

      response.statusCode = status

      const message: OutgoingMessage = {}
      const verbose = exception instanceof ClientError || this.properties.debug

      if (verbose)
        message.body = exception instanceof Exception
          ? exception.body
          : (exception.stack ?? exception.message)

      write(request, response, message)
    }
  }
}

function negotiate (request: http.IncomingMessage, message: IncomingMessage): void {
  if (request.headers.accept !== undefined) {
    const match = SUBTYPE.exec(request.headers.accept)

    if (match !== null) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { type, subtype, suffix } = match.groups!

      request.headers.accept = `${type}/${suffix}`
      message.subtype = subtype
    }
  }

  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  message.encoder = mediaType === undefined ? null : formats[mediaType]
}

// https://github.com/whatwg/fetch/issues/1254
async function adam (request: http.IncomingMessage): Promise<void> {
  const completed = promex()
  const devnull = fs.createWriteStream(os.devNull)

  request
    .on('end', completed.callback)
    .pipe(devnull)

  return completed
}

const DEFAULTS: Properties = {
  methods: new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  debug: false,
  trace: false,
  port: 8000
}

interface Properties {
  methods: Set<string>
  debug: boolean
  trace: boolean
  port: number
}

export type Processing = (input: IncomingMessage) => Promise<OutgoingMessage>

const SUBTYPE = /^(?<type>\w{1,32})\/(vnd\.toa\.(?<subtype>\S{1,32})\+)(?<suffix>\S{1,32})$/

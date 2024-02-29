import fs from 'node:fs'
import os from 'node:os'
import * as http from 'node:http'
import assert from 'node:assert'
import { once } from 'node:events'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import { type OutgoingMessage, write } from './messages'
import { ClientError, Exception } from './exceptions'
import { Context } from './Context'
import type { IncomingMessage } from './Context'

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
    this.server.listen(this.properties.port)

    await once(this.server, 'listening')

    console.info('HTTP Server is listening.')
  }

  protected override async close (): Promise<void> {
    this.server.close()

    console.info('HTTP Server stopped accepting new connections.')

    await once(this.server, 'close')

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

    const context = new Context(request as IncomingMessage, this.properties.trace)

    this.process(context)
      .then(this.success(context, response))
      .catch(this.fail(context, response))
  }

  private success (context: Context, response: http.ServerResponse) {
    return (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null)
          status = 404
        else if (context.request.method === 'POST')
          status = 201
        else if (message.body === undefined)
          status = 204
        else
          status = 200

      response.statusCode = message.status = status
      write(context, response, message)
    }
  }

  private fail (context: Context, response: http.ServerResponse) {
    return async (exception: Error) => {
      if (!context.request.complete)
        await adam(context.request)

      response.statusCode = exception instanceof Exception
        ? exception.status
        : 500

      const message: OutgoingMessage = { status: response.statusCode }
      const verbose = exception instanceof ClientError || this.properties.debug

      if (verbose)
        message.body = exception instanceof Exception
          ? exception.body
          : (exception.stack ?? exception.message)

      write(context, response, message)
    }
  }
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

export type Processing = (input: Context) => Promise<OutgoingMessage>

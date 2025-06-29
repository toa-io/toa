import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import * as http from 'node:http'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { type OutgoingMessage, write } from './messages'
import { ClientError, Exception } from './exceptions'
import { Context, type IncomingMessage } from './Context'

export class Server extends Connector {
  private readonly server: http.Server = http.createServer()
  private readonly properties: Properties
  private readonly authorities: Record<string, string>
  private readonly pending = new Map<string, Pending>()
  private pendingInterval: NodeJS.Timeout | null = null
  private process?: Processor
  private ready: boolean = false
  private startedAt: number = 0

  private constructor (properties: Properties) {
    super()

    this.properties = properties
    this.authorities = Object.fromEntries(Object.entries(properties.authorities).map(([key, value]) => [value, key]))

    this.server.on('request', (req, res) => this.listener(req, res))

    this.server.on('clientError', (error, socket) => {
      console.warn('Client connection error', error)

      if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      else socket.destroy()
    })
  }

  public static create (options: Options): Server {
    const properties: Properties = { ...DEFAULTS, ...options }

    return new Server(properties)
  }

  public attach (process: Processor): void {
    this.process = process
  }

  protected override async open (): Promise<void> {
    this.startedAt = Date.now()
    this.server.listen(this.properties.port)

    await once(this.server, 'listening')

    console.info('HTTP Server is listening')

    this.pendingInterval = setInterval(() =>
      console.debug('Pending requests',
        Array.from(this.pending.values()).map(({ method, path }) => (`${method} ${path}`))), 15000)

    await setTimeout(this.properties.delay)

    this.ready = true

    console.info('Ready')
  }

  protected override async close (): Promise<void> {
    this.server.close()
    this.ready = false

    console.info('Stopped accepting new connections')

    await once(this.server, 'close')

    if (this.pendingInterval !== null)
      clearInterval(this.pendingInterval)

    console.info('Stopped')
  }

  private listener (request: http.IncomingMessage, response: http.ServerResponse): void {
    request.once('error', (error) => {
      console.warn('Request error', errorAttributes(request, error))

      if (!response.writableEnded)
        response.destroy()
    })

    request.socket.once('error', (error) => {
      console.warn('Socket error', errorAttributes(request, error))

      if (!response.writableEnded)
        response.destroy()
    })

    const invalid = validate(request)

    if (invalid !== null) {
      console.warn('Invalid request', errorAttributes(request, invalid))

      response.writeHead(400).end()

      return
    }

    if (request.method === undefined || !this.properties.methods.has(request.method)) {
      response.writeHead(501).end()

      return
    }

    if (request.url === '/.ready') {
      if (this.ready)
        response.writeHead(200, { 'cache-control': 'no-store' }).end()
      else {
        const remaining = (Math.ceil((Date.now() - this.startedAt) / 1000)).toString()

        response.writeHead(503, { 'retry-after': remaining }).end()
      }

      return
    }

    assert(this.process !== undefined, 'Request processor is not attached')

    const host = request.headers.host!
    const authority = this.authorities[host] ?? host
    const context = new Context(authority, request as IncomingMessage, this.properties)

    this.pending.set(context.id, { method: request.method, path: request.url! })

    this.process(context)
      .then(this.success(context, response))
      .catch(this.fail(context, response))
      .finally(() => {
        this.pending.delete(context.id)
        request.removeAllListeners('error')
        request.socket.removeAllListeners('error')
      })
  }

  private success (context: Context, response: http.ServerResponse) {
    return async (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null)
          status = 404
        else if (context.request.method === 'POST')
          status = 201
        else if (message.body === undefined && context.request.method !== 'HEAD')
          status = 204
        else
          status = 200

      message.status = status

      await write(context, response, message)
    }
  }

  private fail (context: Context, response: http.ServerResponse) {
    return async (exception: Error) => {
      try {
        if (!context.request.complete)
          await adam(context.request)

        if (!response.writableEnded) {
          response.statusCode = exception instanceof Exception ? exception.status : 500

          const message: OutgoingMessage = { status: response.statusCode }

          // eslint-disable-next-line max-depth
          if (context.encoder === null)
            message.body = undefined
          else if (exception instanceof ClientError || this.properties.debug)
            message.body =
              exception instanceof Exception
                ? exception.body
                : exception.stack ?? exception.message

          await write(context, response, message)
        }
      } catch (final) {
        console.error('Error in error handler', final)

        if (!response.writableEnded)
          try {
            response.writeHead(500).end()
          } catch (e) {
            // Nothing more we can do
          }
      }
    }
  }
}

function validate (request: http.IncomingMessage): null | Error {
  try {
    void new URL(request.url!, `https://${request.headers.host}`)

    return null
  } catch (error) {
    return error as Error
  }
}

// https://github.com/whatwg/fetch/issues/1254
async function adam (request: http.IncomingMessage): Promise<void> {
  const devnull = fs.createWriteStream(os.devNull)

  request.pipe(devnull)

  await once(request, 'end')
}

function errorAttributes (request: http.IncomingMessage, error: Error & any): RequestErrorAttributes {
  const attributes: RequestErrorAttributes = {
    path: request.url!,
    method: request.method!,
    name: error.name
  }

  if (typeof error.code === 'string')
    attributes.code = error.code

  if (typeof error.stack === 'string')
    attributes.stack = error.stack

  return attributes
}

export const PORT = 8000
export const DELAY = 3 // seconds

const DEFAULTS: Omit<Properties, 'authorities'> = {
  methods: new Set<string>(['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'LOCK', 'UNLOCK']),
  debug: false,
  trace: false,
  port: PORT,
  delay: DELAY * 1000
}

interface Properties {
  authorities: Record<string, string>
  methods: Set<string>
  debug: boolean
  trace: boolean
  port: number
  delay: number
}

export type Options = { authorities: Properties['authorities'] } & {
  [K in Exclude<keyof Properties, 'authorities'>]?: Properties[K]
}

export type Processor = (input: Context) => Promise<OutgoingMessage>

interface RequestErrorAttributes {
  path: string
  method: string
  name: string
  code?: string
  stack?: string
}

interface Pending {
  method: string
  path: string
}

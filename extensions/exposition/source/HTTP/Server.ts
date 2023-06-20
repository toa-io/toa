import express from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import { type IncomingMessage, type OutgoingMessage, read, write } from './messages'
import { ClientError, Exception } from './exceptions'
import type * as http from 'node:http'
import type { Express, Request, Response, NextFunction } from 'express'

export class Server extends Connector {
  private readonly debug: boolean
  private readonly app: Express
  private server?: http.Server

  private constructor (app: Express, debug: boolean) {
    super()

    this.app = app
    this.debug = debug
  }

  public static create (options: Partial<Properties> = {}): Server {
    const properties: Properties = Object.assign({}, defaults, options)

    const app = express()

    app.disable('x-powered-by')
    app.enable('case sensitive routing')
    app.enable('strict routing')
    app.use(cors({ allowedHeaders: ['content-type'] }))
    app.use(supportedMethods(properties.methods))

    return new Server(app, properties.debug)
  }

  public attach (process: Processing): void {
    this.app.use((request: Request, response: Response): void => {
      this.read(request)
        .then(process)
        .then(this.success(request, response))
        .catch(this.fail(request, response))
    })
  }

  protected override async open (): Promise<void> {
    const listening = promex<undefined>()

    this.server = this.app.listen(8000, listening.callback)

    await listening

    console.info('HTTP Server is listening.')
  }

  protected override async close (): Promise<void> {
    const stopped = promex<undefined>()

    this.server?.close(stopped.callback)

    await stopped

    console.info('HTTP Server has been stopped.')
  }

  private async read (request: Request): Promise<IncomingMessage> {
    const { path, headers } = request
    const value = await read(request)

    return { path, headers, value }
  }

  private success (request: Request, response: Response) {
    return (message: OutgoingMessage) => {
      for (const [header, value] of Object.entries(message.headers))
        response.set(header, value as string)

      if (message.value === undefined)
        response.status(204)
      else {
        response.status(200)
        write(request, response, message.value)
      }
    }
  }

  private fail (request: Request, response: Response) {
    return (exception: Error) => {
      const status = exception instanceof Exception ? exception.status : 500
      const outputAllowed = exception instanceof ClientError || this.debug

      response.status(status)

      if (exception.message !== '' && outputAllowed) {
        response.set('content-type', 'text/plain')
        response.send(exception.message)
      } else
        response.end()
    }
  }
}

function supportedMethods (methods: Set<string>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (methods.has(req.method)) next()
    else res.sendStatus(501)
  }
}

interface Properties {
  methods: Set<string>
  debug: boolean
}

const defaults: Properties = {
  methods: new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  debug: false
}

export type Processing = (input: IncomingMessage) => Promise<OutgoingMessage>

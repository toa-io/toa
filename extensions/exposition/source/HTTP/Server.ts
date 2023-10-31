import express from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import { read, write, type IncomingMessage, type OutgoingMessage } from './messages'
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
    const properties: Properties = Object.assign({}, defaults(), options)

    const app = express()

    app.disable('x-powered-by')
    app.use(cors({ allowedHeaders: ['content-type'] }))
    app.use(supportedMethods(properties.methods))

    return new Server(app, properties.debug)
  }

  public attach (process: Processing): void {
    this.app.use((request: Request, response: Response): void => {
      this.extend(request)
        .then(process)
        .then(this.success(request, response))
        .catch(this.fail(request, response))
    })
  }

  protected override async open (): Promise<void> {
    const listening = promex()

    this.server = this.app.listen(8000, listening.callback)

    await listening

    console.info('HTTP Server is listening.')
  }

  protected override async close (): Promise<void> {
    const stopped = promex()

    this.server?.close(stopped.callback)

    await stopped
  }

  protected override dispose (): void {
    console.info('HTTP Server has been stopped.')
  }

  private async extend (request: Request): Promise<IncomingMessage> {
    const message = request as unknown as IncomingMessage

    message.parse = async <T> (): Promise<T> => await read(request)

    return message
  }

  private success (request: Request, response: Response) {
    return (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null) status = 404
        else if (request.method === 'POST') status = 201
        else if (message.body === undefined) status = 204
        else status = 200

      response
        .status(status)
        .set(message.headers)

      if (message.body !== undefined && message.body !== null)
        write(request, response, message.body)
      else
        response.end()
    }
  }

  private fail (request: Request, response: Response) {
    return (exception: Error) => {
      const status = exception instanceof Exception
        ? exception.status
        : 500

      response.status(status)

      const outputAllowed = exception instanceof ClientError || this.debug

      if (outputAllowed) {
        const body = exception instanceof Exception
          ? exception.body
          : (exception.stack ?? exception.message)

        write(request, response, body)
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

function defaults (): Properties {
  return {
    methods: new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    debug: false
  }
}

export type Processing = (input: IncomingMessage) => Promise<OutgoingMessage>

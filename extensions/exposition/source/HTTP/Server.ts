import express from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import * as syntax from '../RTD/syntax'
import type * as http from 'node:http'
import type { Express, Request, Response, NextFunction } from 'express'

export class Server extends Connector {
  private readonly app: Express
  private server?: http.Server

  private constructor (app: Express) {
    super()

    this.app = app
  }

  public static create (): Server {
    const app = express()

    app.disable('x-powered-by')
    app.enable('case sensitive routing')
    app.enable('strict routing')
    app.use(cors({ allowedHeaders: ['content-type'] }))
    app.use(supportedMethods)

    return new Server(app)
  }

  public attach (process: Processing): void {
    this.app.use((request: Request, response: Response, next: NextFunction) => {
      const message = { path: '' }

      process(message)
        .then(this.success(response))
        .catch(next)
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

  private success (response: Response): (output: Message) => void {
    return (output: Message) => {
      if (output.value === undefined) response.status(204)
      else response.status(200)
    }
  }
}

function supportedMethods (req: Request, res: Response, next: NextFunction): void {
  if (syntax.methods.has(req.method as syntax.Method)) next()
  else res.sendStatus(501)
}

export interface Message {
  headers?: Record<string, string>
  value?: any
}

export interface IncomingMessage extends Message {
  path: string
}

export type Processing = (input: IncomingMessage) => Promise<Message>

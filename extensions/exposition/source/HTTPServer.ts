import express from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import { promex } from '@toa.io/generic'
import * as syntax from './RTD/syntax'
import type { Server } from 'node:http'
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express'

export class HTTPServer extends Connector {
  private readonly app: Express
  private server?: Server

  private constructor (app: Express) {
    super()

    this.app = app
  }

  public static create (): HTTPServer {
    const app = express()

    app.disable('x-powered-by')
    app.enable('case sensitive routing')
    app.enable('strict routing')
    app.use(cors({ allowedHeaders: ['content-type'] }))
    app.use(supportedMethods)

    return new HTTPServer(app)
  }

  public handle (handler: RequestHandler): void {
    this.app.use(handler)
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
}

function supportedMethods (req: Request, res: Response, next: NextFunction): void {
  if (syntax.methods.has(req.method as syntax.Method)) next()
  else res.sendStatus(501)
}

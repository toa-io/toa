import express from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import * as syntax from './RTD/syntax'
import type { Server } from 'node:http'
import type { Express, Request, Response, NextFunction } from 'express'

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

  public override async open (): Promise<void> {
    this.server = this.app.listen(8000, () => {
      console.info('HTTP Server is listening.')
    })
  }

  public override async close (): Promise<void> {
    this.server?.close(() => {
      console.info('HTTP Server stopped.')
    })
  }
}

function supportedMethods (req: Request, res: Response, next: NextFunction): void {
  if (syntax.methods.has(req.method as syntax.Method)) next()
  else res.sendStatus(501)
}

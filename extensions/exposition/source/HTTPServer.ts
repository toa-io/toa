import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { Connector } from '@toa.io/core'
import { type Server } from 'node:http'
import * as syntax from './RTD/syntax'

export class HTTPServer extends Connector {
  private readonly app: Express
  private server?: Server

  public constructor (app: Express) {
    super()

    this.app = app
  }

  public static create (): HTTPServer {
    return create()
  }

  public async open (): Promise<void> {
    this.server = this.app.listen(8000, () => {
      console.info('HTTP Server is listening.')
    })
  }

  public async close (): Promise<void> {
    this.server?.close(() => {
      console.info('HTTP Server stopped.')
    })
  }
}

function create (): HTTPServer {
  const app = express()

  app.disable('x-powered-by')
  app.enable('case sensitive routing')
  app.enable('strict routing')
  app.use(cors({ allowedHeaders: ['content-type'] }))
  app.use(methods)

  return new HTTPServer(app)
}

function methods (req: Request, res: Response, next: NextFunction): void {
  if (syntax.methods.has(req.method as syntax.method)) next()
  else res.status(501).end()
}

import * as http from 'node:http'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { decode } from '@toa.io/generic'

export class Ready extends Connector {
  public readonly name = 'ready'

  private readonly server: http.Server = http.createServer()
  private readonly options: ReadyOptions
  private ready = false
  private startedAt = 0
  private listening = false
  private skipped = false

  public constructor (options: ReadyOptions) {
    super()

    this.options = options
    this.server.on('request', (req, res) => this.#listener(req, res))
  }

  public static create (): Ready | null {
    const options = resolveOptions()

    if (options === null)
      return null

    return new Ready(options)
  }

  public async listen (): Promise<void> {
    if (this.listening || this.skipped)
      return

    this.startedAt = Date.now()

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error): void => {
          this.server.off('listening', onListening)
          reject(error)
        }

        const onListening = (): void => {
          this.server.off('error', onError)
          resolve()
        }

        this.server.once('error', onError)
        this.server.once('listening', onListening)
        this.server.listen(this.options.port)
      })
    } catch (error: any) {
      // Local multi-process (pm2 + features) shares a host; k8s pods do not.
      if (error?.code === 'EADDRINUSE') {
        this.skipped = true
        console.warn('Ready probe port already in use, skipping', { port: this.options.port })

        return
      }

      throw error
    }

    this.listening = true
  }

  public async complete (): Promise<void> {
    await this.listen()

    if (this.skipped)
      return

    this.ready = true

    console.info('Ready')
  }

  protected override async open (): Promise<void> {
    await this.listen()
  }

  protected override async close (): Promise<void> {
    this.ready = false

    if (!this.listening)
      return

    this.server.close()
    this.listening = false
  }

  #listener (request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.url !== this.options.path) {
      response.writeHead(404).end()

      return
    }

    if (this.ready)
      response.writeHead(200, { 'cache-control': 'no-store' }).end()
    else {
      const remaining = Math.ceil((Date.now() - this.startedAt) / 1000).toString()

      response.writeHead(503, { 'retry-after': remaining }).end()
    }
  }
}

export function resolveOptions (): ReadyOptions | null {
  const env = process.env[READY_ENV]

  if (env === undefined)
    return { ...DEFAULTS }

  const decoded = decode(env) as ReadyConfig

  if (decoded === false || decoded.enabled === false)
    return null

  return {
    path: decoded.path ?? DEFAULTS.path,
    port: decoded.port ?? DEFAULTS.port
  }
}

export function normalizeAnnotation (ready: ReadyAnnotation | undefined): ReadyConfig | false {
  if (ready === false)
    return false

  if (ready === undefined)
    return { enabled: true, ...DEFAULT_ANNOTATION }

  return {
    enabled: true,
    path: ready.path ?? DEFAULT_ANNOTATION.path,
    port: ready.port ?? DEFAULT_ANNOTATION.port
  }
}

export const READY_ENV = 'TOA_TELEMETRY_READY'
export const DEFAULT_ANNOTATION = {
  path: '/.ready',
  port: 8001
} as const

const DEFAULTS: ReadyOptions = { ...DEFAULT_ANNOTATION }

export interface ReadyOptions {
  path: string
  port: number
}

export type ReadyAnnotation = false | {
  path?: string
  port?: number
}

export type ReadyConfig = false | {
  enabled?: boolean
  path?: string
  port?: number
}

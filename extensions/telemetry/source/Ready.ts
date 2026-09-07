import * as http from 'node:http'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { environment } from '@toa.io/generic'
import {
  DEFAULT_ANNOTATION,
  READY_ENV,
  type ReadyConfig
} from '@toa.io/definitions/extensions.telemetry'

export class Ready extends Connector {
  public readonly name = 'ready'

  private readonly server: http.Server = http.createServer()
  private readonly options: ReadyOptions
  private ready = false
  private startedAt = 0
  private listening = false
  private skipped = false

  public constructor(options: ReadyOptions) {
    super()

    this.options = options
    this.server.on('request', (req, res) => this.#listener(req, res))
  }

  public static create(): Ready | null {
    const options = resolveOptions()

    if (options === null) return null

    return new Ready(options)
  }

  public async listen(): Promise<void> {
    if (this.listening || this.skipped) return

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
        console.warn('Ready probe port already in use, skipping', {
          port: this.options.port
        })

        return
      }

      throw error
    }

    this.listening = true

    // a readiness probe answers while the process runs; it must never be the reason it keeps running
    this.server.unref()
  }

  public async complete(): Promise<void> {
    await this.listen()

    this.ready = true

    console.info('Ready')

    // the IPC signal is not tied to the probe: a process that gave up the shared port
    // is still ready, and pm2 `wait_ready` would otherwise block until `listen_timeout`
    process.send?.('ready')
  }

  protected override async open(): Promise<void> {
    await this.listen()
  }

  protected override async close(): Promise<void> {
    this.ready = false

    if (!this.listening) return

    this.listening = false

    // keep-alive connections would otherwise hold the server handle, delaying the exit
    this.server.closeAllConnections()

    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  #listener(request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.url !== this.options.path) {
      response.writeHead(404).end()

      return
    }

    if (this.ready) response.writeHead(200, { 'cache-control': 'no-store' }).end()
    else {
      const remaining = Math.ceil((Date.now() - this.startedAt) / 1000).toString()

      response.writeHead(503, { 'retry-after': remaining }).end()
    }
  }
}

export function resolveOptions(): ReadyOptions | null {
  const env = environment.get(READY_ENV)

  if (env === undefined) return { ...DEFAULTS }

  const decoded = JSON.parse(env) as ReadyConfig

  if (decoded === false || decoded.enabled === false) return null

  return {
    path: decoded.path ?? DEFAULTS.path,
    port: decoded.port ?? DEFAULTS.port
  }
}

const DEFAULTS: ReadyOptions = { ...DEFAULT_ANNOTATION }

export interface ReadyOptions {
  path: string
  port: number
}

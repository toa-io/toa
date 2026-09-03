import * as http from 'node:http'
import { console } from 'openspan'

/**
 * The readiness probe, on a port of its own.
 *
 * It cannot share the port the gateway serves traffic on: kubelet speaks HTTP/1.1 only, and a
 * cleartext HTTP/2 server answers nothing else on its port — there is no ALPN to negotiate with.
 *
 * It is the gateway's own readiness, not the process's. The identity composition nested in this
 * process connects before route discovery has settled, so a probe tied to that composition would
 * report ready while the gateway still had no routes and no open port.
 */
export class Probe {
  private readonly server = http.createServer()
  private readonly port: number
  private readonly path: string

  private ready = false
  private startedAt = 0
  private listening = false
  private skipped = false

  public constructor (port: number, path: string = PATH) {
    this.port = port
    this.path = path

    this.server.on('request', (request, response) => this.listener(request, response))
  }

  public async listen (): Promise<void> {
    this.startedAt = Date.now()

    try {
      await new Promise<void>((resolve, reject) => {
        this.server.once('error', reject)
        this.server.listen(this.port, () => {
          this.server.removeListener('error', reject)
          resolve()
        })
      })
    } catch (error: any) {
      // processes sharing a host share the port; in a pod nothing else claims it
      if (error?.code === 'EADDRINUSE') {
        this.skipped = true

        console.warn('Ready probe port already in use, skipping', { port: this.port })

        return
      }

      throw error
    }

    this.listening = true

    // a probe answers while the process runs; it must never be the reason it keeps running
    this.server.unref()
  }

  /** The gateway is listening and has routes: answer `200`. */
  public complete (): void {
    this.ready = true

    // the IPC signal is not tied to the probe: a process that gave up the shared port is
    // still ready, and pm2 `wait_ready` would otherwise block until `listen_timeout`
    process.send?.('ready')
  }

  public async close (): Promise<void> {
    this.ready = false

    if (!this.listening || this.skipped)
      return

    this.listening = false

    // keep-alive connections would otherwise hold the server handle, delaying the exit
    this.server.closeAllConnections()

    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  private listener (request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.url !== this.path) {
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

/**
 * Reserved for this probe. `8001` is the Telemetry readiness probe's, and `toa export` refuses a
 * port claimed twice — `toa mono` and a local run put every service in one process.
 */
export const PROBE = 8004
export const PATH = '/.ready'

/**
 * The initial delay of the readiness probe. The server does not sleep for it: whoever
 * probes is the one that waits, and doing it here as well only delayed the process twice.
 */
export const DELAY = 3 // seconds

import * as http from 'node:http'
import { Connector } from '@toa.io/core'
import { console } from 'openspan'

/**
 * Serves the introspection UI.
 *
 * A placeholder for now — the map is still read through the components' own API.
 * What this page contains is Stage 3.
 */
export class UI extends Connector {
  private readonly server: http.Server = http.createServer()
  private readonly port: number
  private readonly base: string

  public constructor (port: number, base: string = '') {
    super()

    this.port = port
    this.base = base
    this.server.on('request', (request, response) => {
      this.listen(request, response)
    })
  }

  protected override async open (): Promise<void> {
    /*
     * A taken port is a real error: uniqueness across services is settled at export
     * time, so nothing here has to negotiate for one.
     */
    await new Promise<void>((resolve, reject) => {
      const failed = (error: Error): void => {
        this.server.off('listening', listening)
        reject(error)
      }

      const listening = (): void => {
        this.server.off('error', failed)
        resolve()
      }

      this.server.once('error', failed)
      this.server.once('listening', listening)
      this.server.listen(this.port)
    })

    console.info('Introspection UI started', { port: this.port, path: this.base + '/' })
  }

  protected override async close (): Promise<void> {
    this.server.close()
  }

  private listen (request: http.IncomingMessage, response: http.ServerResponse): void {
    // the ingress forwards the mount path, so routing happens relative to it
    const path = this.relative(request.url ?? '/')

    if (path !== '/') {
      response.writeHead(404).end()

      return
    }

    response.writeHead(200, { 'content-type': 'text/plain' }).end('OK!')
  }

  private relative (url: string): string {
    const path = url.split('?')[0]

    if (this.base === '' || !path.startsWith(this.base))
      return path

    const relative = path.slice(this.base.length)

    return relative === '' ? '/' : relative
  }
}

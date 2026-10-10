import { once } from 'node:events'
import * as http from 'node:http'
import { afterAll, binding, given } from 'specumber'

/**
 * An application's web manifest, served where the annotation names it. The gateway reads it
 * in the background, so a scenario that asserts what came of the read waits for it first.
 */
@binding()
export class Manifest {
  private static server?: http.Server
  private static body = ''

  /** Settled by the next time the manifest is served in full. */
  private static served: Promise<void> | null = null
  private static resolve: (() => void) | null = null

  @afterAll()
  public static async stop(): Promise<void> {
    if (this.server === undefined) return

    this.server.close()
    await once(this.server, 'close')
    this.server = undefined
  }

  @given('the web manifest:')
  public async serve(json: string): Promise<void> {
    Manifest.body = json
    Manifest.served = new Promise((resolve) => (Manifest.resolve = resolve))

    if (Manifest.server !== undefined) return

    const server = http.createServer((request, response) => {
      if (request.url !== PATH) {
        response.writeHead(404).end()

        return
      }

      response.on('finish', () => Manifest.resolve?.())
      response
        .writeHead(200, { 'content-type': 'application/manifest+json' })
        .end(Manifest.body)
    })

    // in Toa's own block, beside the mock IdP of this suite
    server.listen(PORT, 'localhost')
    await once(server, 'listening')

    Manifest.server = server
  }

  @given('the web manifest has been read')
  public async read(): Promise<void> {
    if (Manifest.served === null) throw new Error('No web manifest is served')

    await Manifest.served

    // the reply is parsed once it has arrived, after the stub has finished sending it
    await new Promise((resolve) => setTimeout(resolve, SETTLE))
  }
}

const PORT = 31008
const PATH = '/manifest.json'
const SETTLE = 100

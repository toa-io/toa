import * as fs from 'node:fs'
import * as http from 'node:http'
import * as path from 'node:path'
import { Connector } from '@toa.io/core'
import { console } from 'openspan'
import { UI_PATH } from './const'

/**
 * Serves the introspection UI: the directory `ui` builds, and nothing else.
 *
 * The page is a single-page application whose mount path is baked into the bundle,
 * so this server routes relative to `UI_PATH` — which is also what the ingress
 * forwards. `/introspection/*` is left alone: that is the components' own API.
 */
export class UI extends Connector {
  private readonly server: http.Server = http.createServer()
  private readonly port: number
  private readonly root: string

  public constructor (port: number, root: string = SITE) {
    super()

    this.port = port
    this.root = root
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

    if (!isFile(path.join(this.root, 'index.html')))
      console.warn('Introspection UI is not built', { root: this.root })

    console.info('Introspection UI started', { port: this.port, path: UI_PATH + '/' })
  }

  protected override async close (): Promise<void> {
    const closed = new Promise<void>((resolve) => this.server.once('close', () => {
      resolve()
    }))

    this.server.close()
    this.server.closeAllConnections()

    await closed
  }

  private listen (request: http.IncomingMessage, response: http.ServerResponse): void {
    void this.respond(request, response).catch((error: Error) => {
      console.error('Introspection UI failure', { message: error.message })

      if (!response.writableEnded)
        response.writeHead(500).end()
    })
  }

  private async respond (request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' }).end()

      return
    }

    const pathname = decode(request.url ?? '/')

    if (pathname === null) {
      response.writeHead(400).end()

      return
    }

    // the port is the explorer's alone, so the root is the way in
    if (pathname === '/') {
      response.writeHead(302, { location: UI_PATH + '/' }).end()

      return
    }

    const file = this.resolve(pathname)

    if (file === null)
      response.writeHead(404).end()
    else
      await this.send(file, request, response)
  }

  /**
   * The file a request lands on, or `null` when nothing does. A path that exists is
   * served as it is; anything else that could be a route falls back to the page,
   * because the client router — not this server — knows what routes there are.
   */
  private resolve (pathname: string): string | null {
    if (!pathname.startsWith(UI_PATH))
      return null

    const relative = pathname.slice(UI_PATH.length)

    if (relative !== '' && !relative.startsWith('/'))
      return null

    const file = path.join(this.root, relative)

    if (file !== this.root && !file.startsWith(this.root + path.sep))
      return null

    if (isFile(file))
      return file

    /*
     * A missing asset is missing, but a route can look like one: `identity.passkeys` is a
     * component, not a file with an extension. What this server would have served is what
     * it knows how to serve, so anything else is a route and falls back to the page — as
     * does anything ending in a slash, which is no name for a file at all.
     */
    const asset = !relative.endsWith('/') && path.extname(relative) in TYPES

    return asset ? null : path.join(this.root, 'index.html')
  }

  private async send (file: string, request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
    const stats = await fs.promises.stat(file).catch(() => null)

    if (stats === null) {
      response.writeHead(503, { 'content-type': 'text/plain' })
        .end('The introspection UI is not built. Run `npm run build:ui`.\n')

      return
    }

    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'content-length': stats.size,
      'cache-control': file.startsWith(path.join(this.root, IMMUTABLE)) ? FOREVER : 'no-cache'
    })

    if (request.method === 'HEAD')
      response.end()
    else
      fs.createReadStream(file).pipe(response)
  }
}

function decode (url: string): string | null {
  try {
    return decodeURIComponent(url.split('?')[0])
  } catch {
    return null
  }
}

function isFile (file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile()
}

/** Where `npm run build:ui` puts the page, from both `source` and `transpiled`. */
const SITE = path.resolve(__dirname, '..', 'ui', 'dist')

/** Assets under this prefix carry their build hash in the name. */
const IMMUTABLE = path.join('_app', 'immutable')
const FOREVER = 'public, max-age=31536000, immutable'

const TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

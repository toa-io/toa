import * as fs from 'node:fs'
import * as path from 'node:path'
import { Readable } from 'node:stream'
import { console } from 'openspan'
import * as http from '../HTTP/index.js'
import { DISCOVERY } from '../const.js'
import type { Input, Output } from '../io.js'
import type { Interceptor } from '../Interception.js'

/**
 * The page that reads the tree: the directory `ui` builds, and nothing else.
 *
 * An interceptor rather than an endpoint, for the reason the OAuth documents are one — it
 * runs before a credential is resolved. A page is public, and one served after `auth` would
 * refuse the client holding a stale token, who is the client most likely to have opened it.
 * It is also what keeps `depart` off these replies: a re-issued credential sets `no-store`,
 * which would take the build hash off every asset that carries one.
 *
 * It claims the whole prefix, so that nothing under it reaches the router — a crawler
 * asking for assets that are not there would otherwise have every one of them counted as a
 * route that has gone missing, and ping discovery about it.
 *
 * `OPTIONS` on the prefix itself is the exception it lets through: the tree is what answers
 * there, and that needs the identity this stage does not have yet.
 */
export class Site implements Interceptor {
  public readonly name = 'discovery'

  /** What a test points at a fixture; the build otherwise. */
  private readonly override: string | undefined
  private root: string

  public constructor(root?: string) {
    this.override = root
    this.root = root ?? site()
  }

  /**
   * Resolved here rather than at construction because this is a module singleton, built
   * when the module loads and before anything has said where the page is. Said once, too,
   * because a page that is not built is otherwise a `503` per request and nothing else.
   */
  public mount(): void {
    this.root = this.override ?? site()

    if (!isFile(path.join(this.root, 'index.html')))
      console.warn('Discovery UI is not built', { root: this.root })
  }

  public intercept(input: Input): Output {
    const { pathname } = input.url

    if (pathname !== DISCOVERY && !pathname.startsWith(DISCOVERY + '/')) return null

    // the prefix itself, as opposed to something under it
    const bare = pathname === DISCOVERY || pathname === DISCOVERY + '/'
    const method = input.request.method

    if (method !== 'GET' && method !== 'HEAD') {
      // the tree answers here, and it needs the identity this stage does not have yet
      if (bare && method === 'OPTIONS') return null

      throw new http.MethodNotAllowed(
        new Headers({ allow: bare ? 'GET, HEAD, OPTIONS' : 'GET, HEAD' })
      )
    }

    // the page is a directory, and every asset it names is relative to it
    if (pathname === DISCOVERY)
      return {
        status: 302,
        headers: new Headers({ location: DISCOVERY + '/' + input.url.search })
      }

    const file = this.resolve(pathname)

    if (file === null) throw new http.NotFound()

    return this.send(file, method)
  }

  /**
   * The file a request lands on, or `null` when nothing does. A path that exists is served
   * as it is; anything else that could be a route falls back to the page, because the
   * client router — not this server — knows what routes there are.
   */
  private resolve(pathname: string): string | null {
    /*
     * Decoded after the prefix is off, so that an encoded separator cannot smuggle a
     * segment past the test that put us here. A dot segment never arrives — `..` and
     * `%2e%2e` alike are collapsed while the URL is parsed — but `%2f` survives that and
     * decodes to a separator here, which is what the guard below is for.
     */
    const relative = decode(pathname.slice(DISCOVERY.length))

    if (relative === null || relative.includes('\0')) return null

    const file = path.join(this.root, relative)

    if (file !== this.root && !file.startsWith(this.root + path.sep)) return null

    if (isFile(file)) return file

    /*
     * A missing asset is missing, but a route can look like one. What this server would
     * have served is what it knows how to serve, so anything else is a route and falls
     * back to the page — as does anything ending in a slash, which is no name for a file.
     */
    const asset = !relative.endsWith('/') && path.extname(relative) in TYPES

    return asset ? null : path.join(this.root, 'index.html')
  }

  /**
   * Always with a `content-type` of its own: a stream without one is framed as
   * `multipart/*` and the page arrives as an envelope of JSON-encoded buffers.
   */
  private send(file: string, method: string): Output {
    const stats = fs.statSync(file, { throwIfNoEntry: false })

    if (stats === undefined)
      return {
        status: 503,
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        body: Readable.from([Buffer.from(NOT_BUILT)])
      }

    const headers = new Headers({
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'content-length': String(stats.size),
      'cache-control': caching(path.relative(this.root, file))
    })

    // a HEAD reply carries no body but reports the length a GET would have returned; the
    // HTTP/2 layer does not drop one written to it, so none is opened
    if (method === 'HEAD') return { status: 200, headers }

    return { status: 200, headers, body: fs.createReadStream(file) }
  }
}

const NOT_BUILT = 'The discovery UI is not built. Run `npm run build:ui`.\n'

function decode(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return null
  }
}

function isFile(file: string): boolean {
  return fs.statSync(file, { throwIfNoEntry: false })?.isFile() === true
}

/**
 * Where `npm run build:ui` puts the page. Two levels up because this module is a directory
 * deeper than `source` itself, and `transpiled` mirrors that — so it resolves the same from
 * either. The variable is the features', which run against a fixture rather than a build.
 */
function site(): string {
  return (
    process.env.__TESTING_EXPOSITION_DISCOVERY_ROOT ??
    path.resolve(import.meta.dirname, '..', '..', 'ui', 'dist')
  )
}

/** Assets under this prefix carry their build hash in the name. */
const IMMUTABLE = path.join('_app', 'immutable')
const FOREVER = 'public, max-age=31536000, immutable'

/** The icons: named without a hash, so they are re-read, but rarely. */
const ICONS = new Set(['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'])
const DAY = 'public, max-age=86400'

/**
 * How long what is served may be held. The page is never cached — it names the assets, and
 * their names carry the build. An icon is named for what it is rather than for its content,
 * so it is asked about again, but not on every page load.
 */
function caching(relative: string): string {
  if (relative.startsWith(IMMUTABLE)) return FOREVER

  return ICONS.has(relative) ? DAY : 'no-cache'
}

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
